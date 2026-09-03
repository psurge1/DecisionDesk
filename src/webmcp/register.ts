import { decisionStore } from "../store/decisionStore";
import type { DecisionStore } from "../store/decisionStore";
import { createDecisionDeskTools } from "./tools";
import type { WebMcpModelContext, WebMcpTool } from "./types";

export type WebMcpRegistration = {
  supported: boolean;
  registeredToolNames: string[];
  dispose: () => void;
  error?: unknown;
};

export async function registerDecisionDeskWebMcp(
  context: WebMcpModelContext | undefined = document.modelContext,
  store: DecisionStore = decisionStore,
  tools: WebMcpTool[] = createDecisionDeskTools(store),
): Promise<WebMcpRegistration> {
  if (!context) {
    return { supported: false, registeredToolNames: [], dispose: () => undefined };
  }

  const controller = new AbortController();
  const registeredToolNames: string[] = [];

  try {
    for (const tool of tools) {
      await context.registerTool(tool, { signal: controller.signal });
      registeredToolNames.push(tool.name);
    }

    return {
      supported: true,
      registeredToolNames,
      dispose: () => controller.abort(),
    };
  } catch (error) {
    controller.abort();
    return {
      supported: true,
      registeredToolNames,
      dispose: () => undefined,
      error,
    };
  }
}
