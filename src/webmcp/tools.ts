import { decisionStore } from "../store/decisionStore";
import type { DecisionStore } from "../store/decisionStore";
import { createMutationTools } from "./mutationTools";
import { createReadTools } from "./readTools";
import type { WebMcpTool } from "./types";

export function createDecisionDeskTools(
  store: DecisionStore = decisionStore,
): WebMcpTool[] {
  return [...createReadTools(store), ...createMutationTools(store)];
}
