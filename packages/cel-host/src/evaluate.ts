import {
  CelScalar,
  celMethod,
  isCelError,
  isCelList,
  isCelMap,
  mapType,
  run,
  type CelFunc,
  type CelInput,
  type CelValue
} from "@bufbuild/cel";
import { strings } from "@bufbuild/cel/ext";
import { evaluateTemplate, hasTag, inFolder } from "./activation.js";

export interface CelDiagnostic {
  code: string;
  message: string;
}

export interface CelEvaluationResult {
  valid: boolean;
  value: unknown;
  diagnostics: CelDiagnostic[];
}

const stringDynMap = mapType(CelScalar.STRING, CelScalar.DYN);

export const mdbaseCelFunctions: CelFunc[] = [
  celMethod("hasTag", stringDynMap, [CelScalar.STRING], CelScalar.BOOL, function (tag) {
    const tags = this.get("tags");
    if (!isCelList(tags)) {
      return false;
    }
    return hasTag([...tags.values()].filter((value): value is string => typeof value === "string"), tag);
  }),
  celMethod("inFolder", stringDynMap, [CelScalar.STRING], CelScalar.BOOL, function (folder) {
    const value = this.get("folder");
    return typeof value === "string" && inFolder(value, folder);
  })
];

const funcs = [...strings, ...mdbaseCelFunctions];

export function evaluateCel(expression: string, activation: Record<string, CelInput>): CelEvaluationResult {
  const value = run(expression, activation, { funcs });
  if (isCelError(value)) {
    return {
      valid: true,
      value: null,
      diagnostics: [
        {
          code: "expression_evaluation_error",
          message: value.message
        }
      ]
    };
  }
  return {
    valid: true,
    value: normalizeCelValue(value),
    diagnostics: []
  };
}

export function evaluateExpressionValueTemplate(value: unknown, activation: Record<string, CelInput>): unknown {
  return evaluateTemplate(value, activation, (expr, nestedActivation) => {
    const result = evaluateCel(expr, nestedActivation as Record<string, CelInput>);
    return result.value;
  });
}

export function normalizeCelValue(value: CelValue): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }
  if (isCelList(value)) {
    return [...value.values()].map((item) => normalizeCelValue(item));
  }
  if (isCelMap(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, child] of value.entries()) {
      result[String(key)] = normalizeCelValue(child);
    }
    return result;
  }
  return value;
}

