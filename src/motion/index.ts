import { decisionStore } from "../store";
import { createEntranceRegistry } from "./entranceRegistry";

export const entranceRegistry = createEntranceRegistry(decisionStore.getState());

export { createEntranceRegistry } from "./entranceRegistry";
export type { EntranceEntity } from "./entranceRegistry";
