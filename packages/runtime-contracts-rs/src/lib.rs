use std::fs;
use std::path::{Path, PathBuf};

use jsonschema::{Draft, JSONSchema};
use serde_json::Value;
use walkdir::{DirEntry, WalkDir};

const RUNTIME_TYPES: &[&str] = &[
    "provider",
    "action",
    "event",
    "capability",
    "workflow",
    "runtime_policy",
    "runtime_run",
    "runtime_checkpoint",
    "runtime_timer",
    "runtime_diagnostic",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuntimeDiagnostic {
    pub severity: String,
    pub code: String,
    pub message: String,
    pub path: Option<String>,
    pub field: Option<String>,
}

#[derive(Debug, Clone)]
pub struct MarkdownRecord {
    pub path: String,
    pub frontmatter: Value,
    pub body: String,
}

#[derive(Debug, Default)]
pub struct RuntimePackage {
    pub type_files: Vec<MarkdownRecord>,
    pub records: Vec<MarkdownRecord>,
    pub providers: Vec<MarkdownRecord>,
    pub actions: Vec<MarkdownRecord>,
    pub events: Vec<MarkdownRecord>,
    pub capabilities: Vec<MarkdownRecord>,
    pub workflows: Vec<MarkdownRecord>,
    pub policies: Vec<MarkdownRecord>,
    pub diagnostics: Vec<RuntimeDiagnostic>,
}

#[derive(Debug)]
pub struct RuntimeSchemas {
    type_file: Value,
    provider: Value,
    action: Value,
    event: Value,
    capability: Value,
    workflow: Value,
    runtime_policy: Value,
    run: Value,
    checkpoint: Value,
    timer: Value,
    diagnostic: Value,
}

pub fn load_contracts(collection_root: impl AsRef<Path>, schema_root: impl AsRef<Path>) -> Result<RuntimePackage, String> {
    let collection_root = collection_root.as_ref();
    let schemas = RuntimeSchemas::load(schema_root)?;
    schemas.validate_canonical_schemas()?;

    let mut package = RuntimePackage::default();
    for entry in WalkDir::new(collection_root)
        .into_iter()
        .filter_entry(should_descend)
    {
        let entry = entry.map_err(|error| error.to_string())?;
        if !entry.file_type().is_file() || entry.path().extension().and_then(|ext| ext.to_str()) != Some("md") {
            continue;
        }

        let path = relative_path(collection_root, entry.path())?;
        let text = fs::read_to_string(entry.path()).map_err(|error| error.to_string())?;
        match parse_markdown_record(&path, &text) {
            Ok(record) => {
                if path.starts_with("_types/") {
                    package
                        .diagnostics
                        .extend(validate_value(&schemas.type_file, &record.frontmatter, &path));
                    package.type_files.push(record);
                    continue;
                }

                let Some(record_type) = record.frontmatter.get("type").and_then(Value::as_str) else {
                    continue;
                };
                if !RUNTIME_TYPES.contains(&record_type) {
                    continue;
                }

                if let Some(schema) = schemas.for_runtime_type(record_type) {
                    package
                        .diagnostics
                        .extend(validate_value(schema, &record.frontmatter, &path));
                }
                package
                    .diagnostics
                    .extend(validate_embedded_runtime_schemas(record_type, &record.frontmatter, &path));

                match record_type {
                    "provider" => package.providers.push(record.clone()),
                    "action" => package.actions.push(record.clone()),
                    "event" => package.events.push(record.clone()),
                    "capability" => package.capabilities.push(record.clone()),
                    "workflow" => package.workflows.push(record.clone()),
                    "runtime_policy" => package.policies.push(record.clone()),
                    _ => {}
                }
                package.records.push(record);
            }
            Err(diagnostic) => package.diagnostics.push(diagnostic),
        }
    }

    Ok(package)
}

pub fn parse_markdown_record(path: &str, text: &str) -> Result<MarkdownRecord, RuntimeDiagnostic> {
    let Some((frontmatter_text, body)) = split_frontmatter(text) else {
        return Ok(MarkdownRecord {
            path: path.to_string(),
            frontmatter: Value::Object(Default::default()),
            body: text.to_string(),
        });
    };

    let yaml_value = serde_yaml::from_str::<serde_yaml::Value>(frontmatter_text).map_err(|error| RuntimeDiagnostic {
        severity: "error".to_string(),
        code: "invalid_frontmatter".to_string(),
        message: error.to_string(),
        path: Some(path.to_string()),
        field: None,
    })?;

    let frontmatter = if yaml_value.is_null() {
        Value::Object(Default::default())
    } else {
        serde_json::to_value(yaml_value).map_err(|error| RuntimeDiagnostic {
            severity: "error".to_string(),
            code: "invalid_frontmatter".to_string(),
            message: error.to_string(),
            path: Some(path.to_string()),
            field: None,
        })?
    };

    if !frontmatter.is_object() {
        return Err(RuntimeDiagnostic {
            severity: "error".to_string(),
            code: "invalid_frontmatter".to_string(),
            message: "Frontmatter must parse to an object.".to_string(),
            path: Some(path.to_string()),
            field: None,
        });
    }

    Ok(MarkdownRecord {
        path: path.to_string(),
        frontmatter,
        body: body.to_string(),
    })
}

impl RuntimeSchemas {
    pub fn load(schema_root: impl AsRef<Path>) -> Result<Self, String> {
        let schema_root = schema_root.as_ref();
        Ok(Self {
            type_file: read_json(schema_root.join("type-file.schema.json"))?,
            provider: read_json(schema_root.join("runtime/provider.schema.json"))?,
            action: read_json(schema_root.join("runtime/action.schema.json"))?,
            event: read_json(schema_root.join("runtime/event.schema.json"))?,
            capability: read_json(schema_root.join("runtime/capability.schema.json"))?,
            workflow: read_json(schema_root.join("runtime/workflow.schema.json"))?,
            runtime_policy: read_json(schema_root.join("runtime/runtime-policy.schema.json"))?,
            run: read_json(schema_root.join("runtime/run.schema.json"))?,
            checkpoint: read_json(schema_root.join("runtime/checkpoint.schema.json"))?,
            timer: read_json(schema_root.join("runtime/timer.schema.json"))?,
            diagnostic: read_json(schema_root.join("runtime/diagnostic.schema.json"))?,
        })
    }

    pub fn validate_canonical_schemas(&self) -> Result<(), String> {
        for (name, schema) in [
            ("type-file", &self.type_file),
            ("provider", &self.provider),
            ("action", &self.action),
            ("event", &self.event),
            ("capability", &self.capability),
            ("workflow", &self.workflow),
            ("runtime-policy", &self.runtime_policy),
            ("run", &self.run),
            ("checkpoint", &self.checkpoint),
            ("timer", &self.timer),
            ("diagnostic", &self.diagnostic),
        ] {
            compile_schema(schema).map_err(|error| format!("{name} schema is invalid: {error}"))?;
        }
        Ok(())
    }

    fn for_runtime_type(&self, record_type: &str) -> Option<&Value> {
        match record_type {
            "action" => Some(&self.action),
            "provider" => Some(&self.provider),
            "event" => Some(&self.event),
            "capability" => Some(&self.capability),
            "workflow" => Some(&self.workflow),
            "runtime_policy" => Some(&self.runtime_policy),
            "runtime_run" => Some(&self.run),
            "runtime_checkpoint" => Some(&self.checkpoint),
            "runtime_timer" => Some(&self.timer),
            "runtime_diagnostic" => Some(&self.diagnostic),
            _ => None,
        }
    }
}

fn validate_value(schema: &Value, value: &Value, path: &str) -> Vec<RuntimeDiagnostic> {
    let Ok(compiled) = compile_schema(schema) else {
        return vec![RuntimeDiagnostic {
            severity: "error".to_string(),
            code: "invalid_schema".to_string(),
            message: "Canonical schema could not be compiled.".to_string(),
            path: Some(path.to_string()),
            field: None,
        }];
    };

    let diagnostics = match compiled.validate(value) {
        Ok(()) => Vec::new(),
        Err(errors) => errors
            .map(|error| RuntimeDiagnostic {
                severity: "error".to_string(),
                code: format!("schema_{:?}", error.kind),
                message: error.to_string(),
                path: Some(path.to_string()),
                field: Some(error.instance_path.to_string()),
            })
            .collect(),
    };
    diagnostics
}

fn validate_embedded_runtime_schemas(record_type: &str, value: &Value, path: &str) -> Vec<RuntimeDiagnostic> {
    let Some(schemas) = value.get("schemas").and_then(Value::as_object) else {
        return Vec::new();
    };

    let mut diagnostics = Vec::new();
    if record_type == "action" {
        if let Some(schema) = schemas.get("input") {
            diagnostics.extend(validate_embedded_json_schema(schema, &format!("{path}#/schemas/input")));
        }
        if let Some(schema) = schemas.get("output").filter(|schema| !schema.is_null()) {
            diagnostics.extend(validate_embedded_json_schema(schema, &format!("{path}#/schemas/output")));
        }
    }
    if record_type == "event" {
        if let Some(schema) = schemas.get("payload") {
            diagnostics.extend(validate_embedded_json_schema(schema, &format!("{path}#/schemas/payload")));
        }
    }
    diagnostics
}

fn validate_embedded_json_schema(schema: &Value, path: &str) -> Vec<RuntimeDiagnostic> {
    match compile_schema(schema) {
        Ok(_) => Vec::new(),
        Err(error) => vec![RuntimeDiagnostic {
            severity: "error".to_string(),
            code: "invalid_embedded_schema".to_string(),
            message: error,
            path: Some(path.to_string()),
            field: None,
        }],
    }
}

fn compile_schema(schema: &Value) -> Result<JSONSchema, String> {
    JSONSchema::options()
        .with_draft(Draft::Draft202012)
        .compile(schema)
        .map_err(|error| error.to_string())
}

fn read_json(path: PathBuf) -> Result<Value, String> {
    let text = fs::read_to_string(&path).map_err(|error| format!("{}: {error}", path.display()))?;
    serde_json::from_str(&text).map_err(|error| format!("{}: {error}", path.display()))
}

fn split_frontmatter(text: &str) -> Option<(&str, &str)> {
    let rest = text.strip_prefix("---\n")?;
    let delimiter = "\n---\n";
    let end = rest.find(delimiter)?;
    Some((&rest[..end], &rest[end + delimiter.len()..]))
}

fn relative_path(root: &Path, path: &Path) -> Result<String, String> {
    path.strip_prefix(root)
        .map_err(|error| error.to_string())
        .map(|relative| relative.to_string_lossy().replace('\\', "/"))
}

fn should_descend(entry: &DirEntry) -> bool {
    let name = entry.file_name().to_string_lossy();
    !matches!(name.as_ref(), ".git" | ".mdbase" | "node_modules" | "dist" | "target")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn repo_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .and_then(Path::parent)
            .expect("crate should live under packages/runtime-contracts-rs")
            .to_path_buf()
    }

    #[test]
    fn loads_canvas_runtime_example() {
        let root = repo_root();
        let package = load_contracts(
            root.join("examples/v0.3/canvas-runtime"),
            root.join("schemas/v0.3"),
        )
        .expect("load contracts");

        assert_eq!(package.diagnostics, []);
        assert_eq!(package.type_files.len(), 12);
        assert_eq!(package.providers.len(), 2);
        assert_eq!(package.actions.len(), 1);
        assert_eq!(package.events.len(), 2);
        assert_eq!(package.capabilities.len(), 1);
        assert_eq!(package.workflows.len(), 1);
        assert_eq!(package.policies.len(), 1);
    }

    #[test]
    fn rejects_invalid_embedded_json_schema() {
        let value = serde_json::json!({
            "type": "action",
            "id": "bad.action",
            "version": 1,
            "provider": "mdbase",
            "name": "Bad action",
            "schemas": {
                "dialect": "json-schema-2020-12",
                "input": {
                    "type": "strung"
                }
            }
        });

        let diagnostics = validate_embedded_runtime_schemas("action", &value, "actions/bad.md");
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].code, "invalid_embedded_schema");
    }
}
