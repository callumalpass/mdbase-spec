# mdbase Quick Reference (v0.2.1)

One-page implementor card for frequent lookups.

## Operations (Conformance Runner Surface)

Core:
- `load_config`
- `load_types`
- `get_type`
- `get_types`
- `create_type`
- `create`
- `read`
- `update`
- `delete`
- `rename`
- `validate`
- `query`
- `evaluate`
- `init`

Level 4-6 and extended:
- `parse_link`
- `resolve_link`
- `backfill`
- `batch_update`
- `batch_delete`
- `migrate`
- `cache_rebuild`
- `cache_clear`
- `watch`

## Field Types

Primitive:
- `string`
- `integer`
- `number`
- `boolean`
- `date`
- `datetime`
- `time`
- `enum`

Composite and special:
- `list`
- `object`
- `link`
- `tags`
- `any`

Common field options:
- `required`
- `default`
- `generated`
- `deprecated`
- `unique`

## Error Codes (Appendix C)

Validation:
- `missing_required`
- `type_mismatch`
- `constraint_violation`
- `invalid_enum`
- `unknown_field`
- `deprecated_field`
- `duplicate_id`
- `duplicate_value`
- `list_too_short`
- `list_too_long`
- `list_duplicate`
- `list_item_invalid`
- `string_too_short`
- `string_too_long`
- `pattern_mismatch`
- `number_too_small`
- `number_too_large`
- `not_integer`
- `invalid_link`
- `link_not_found`
- `link_wrong_type`
- `ambiguous_link`
- `invalid_date`
- `invalid_datetime`
- `invalid_time`

Type system:
- `unknown_type`
- `circular_inheritance`
- `missing_parent_type`
- `type_conflict`
- `invalid_type_definition`
- `circular_computed`

Operations:
- `file_not_found`
- `path_conflict`
- `path_required`
- `invalid_path`
- `invalid_frontmatter`
- `validation_failed`
- `invalid_request`
- `invalid_migration`
- `migration_failed`
- `permission_denied`
- `concurrent_modification`
- `path_traversal`
- `match_failed`
- `rename_ref_update_failed`
- `invalid_config`
- `missing_config`
- `unsupported_version`

Expressions and formulas:
- `invalid_expression`
- `unknown_function`
- `wrong_argument_count`
- `type_error`
- `expression_depth_exceeded`
- `circular_formula`
- `invalid_formula`
- `formula_evaluation_error`

## Expression Operators

Comparison:
- `==`, `!=`, `>`, `<`, `>=`, `<=`

Arithmetic:
- `+`, `-`, `*`, `/`, `%`

Boolean:
- `&&`, `||`, `!`

Null/default:
- `??`
- `default(value, fallback)`
- `exists(field)`
- `field.isEmpty()`

Conditional:
- `if(condition, then, else)`

## Operator Precedence (High -> Low)

1. Grouping: `( )`
2. Property/method access: `.`, `[]`, `()`
3. Unary: `!`, unary `-`
4. Multiplication: `*`, `/`, `%`
5. Addition: `+`, `-`
6. Comparison: `>`, `<`, `>=`, `<=`
7. Equality: `==`, `!=`
8. AND: `&&`
9. OR: `||`
10. Null coalescing: `??`

## Most-Used Methods/Functions

Strings:
- `.contains()`, `.startsWith()`, `.endsWith()`, `.matches()`
- `.lower()`, `.upper()`, `.title()`, `.trim()`
- `.split()`, `.slice()`, `.replace()`, `.reverse()`

Lists:
- `.contains()`, `.containsAll()`, `.containsAny()`
- `.filter()`, `.map()`, `.reduce()`
- `.sort()`, `.unique()`, `.flat()`, `.join()`

Date/time:
- `now()`, `today()`, `date()`, `datetime()`
- `.year`, `.month`, `.day`, `.hour`, `.minute`, `.second`, `.dayOfWeek`
- `.date()`, `.time()`, `.format()`
- `duration("1d")`

Link/file:
- `link(path)`
- `linkValue.asFile()`
- `file.hasLink()`, `file.hasTag()`, `file.hasProperty()`, `file.inFolder()`
- `file.asLink(display?)`

## Core Semantics Reminders

- Missing vs null vs empty string are distinct.
- `default` applies only when a field is missing, not present-null.
- `exists(field)` is true for present-null.
- `field.isEmpty()` is true for missing, null, or empty.
- In strict mode, explicit type keys are implicitly allowed.
- For query sort: nulls are last (ASC), first (DESC); tie-break by `file.path` ASC.
