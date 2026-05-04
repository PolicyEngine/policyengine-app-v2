export type NormalizedVariableValueType = 'float' | 'int' | 'bool' | 'Enum' | 'str' | string;

export function normalizeVariableValueType(rawValueType: unknown): NormalizedVariableValueType {
  if (typeof rawValueType !== 'string' || rawValueType.length === 0) {
    return '';
  }

  const normalized = rawValueType.toLowerCase();

  switch (normalized) {
    case 'float':
    case 'number':
      return 'float';
    case 'int':
    case 'integer':
      return 'int';
    case 'bool':
    case 'boolean':
      return 'bool';
    case 'enum':
      return 'Enum';
    case 'str':
    case 'string':
      return 'str';
    default:
      return rawValueType;
  }
}

export function getNormalizedVariableMetadata(variable: Record<string, any> | null | undefined) {
  const rawVariable = variable ?? {};

  return {
    defaultValue: rawVariable.defaultValue ?? rawVariable.default_value,
    documentation: rawVariable.documentation || rawVariable.description,
    entity: rawVariable.entity ?? '',
    hiddenInput: rawVariable.hiddenInput ?? rawVariable.hidden_input ?? false,
    isInputVariable: rawVariable.isInputVariable ?? rawVariable.is_input_variable ?? false,
    label: rawVariable.label ?? rawVariable.name ?? '',
    moduleName: rawVariable.moduleName ?? rawVariable.module_name ?? '',
    name: rawVariable.name ?? '',
    possibleValues: rawVariable.possibleValues ?? rawVariable.possible_values,
    unit: rawVariable.unit ?? rawVariable.variable_unit ?? null,
    valueType: normalizeVariableValueType(
      rawVariable.valueType ?? rawVariable.value_type ?? rawVariable.data_type
    ),
  };
}
