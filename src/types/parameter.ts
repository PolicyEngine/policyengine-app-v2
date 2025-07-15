// Based on what the API currently exposes
export interface Parameter {
  label: string;
  type: "parameter" | "parameterNode" | any; // TODO: Add more types as needed
  parameter: string; // Dot-separated path to parameter; often used as 'name' elsewhere in app
  description?: string | null;
  unit?: string | null;
  period?: string | null; // TODO: Specify period values
  values?: Record<string, number>; // Historical values
  economy?: boolean;
  household?: boolean;
}

export type ParameterMetadata = Record<string, Parameter>;