export type JsonSchema = {
  type: "object";
  properties?: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties?: boolean;
};

export type WebMcpTool<TInput extends Record<string, unknown> = Record<string, unknown>> = {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: TInput) => unknown | Promise<unknown>;
};

export type WebMcpModelContext = {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => void | Promise<void>;
};

declare global {
  interface Document {
    modelContext?: WebMcpModelContext;
  }
}
