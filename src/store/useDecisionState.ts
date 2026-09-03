import { useSyncExternalStore } from "react";
import type { AppState, Desk } from "../types";
import { decisionStore } from "./decisionStore";

export function useDecisionState(): AppState {
  return useSyncExternalStore(
    decisionStore.subscribe,
    decisionStore.getState,
    decisionStore.getState,
  );
}

export function useCurrentDesk(): Desk | null {
  useDecisionState();
  return decisionStore.getCurrentDesk();
}
