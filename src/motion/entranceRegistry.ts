import type { AppState, ContentSource } from "../types";

export type EntranceEntity = "option" | "thought" | "consideration";

type Clock = () => number;

const REMOUNT_WINDOW_MS = 900;

function entityKey(entity: EntranceEntity, id: string): string {
  return `${entity}:${id}`;
}

function collectEntityKeys(state: AppState): Set<string> {
  const keys = new Set<string>();

  for (const desk of state.desks) {
    for (const option of desk.options) {
      keys.add(entityKey("option", option.id));

      for (const thought of option.thoughts) {
        keys.add(entityKey("thought", thought.id));
      }
    }

    for (const consideration of desk.considerations) {
      keys.add(entityKey("consideration", consideration.id));
    }
  }

  return keys;
}

export function createEntranceRegistry(initialState: AppState, now: Clock = Date.now) {
  const existingEntities = collectEntityKeys(initialState);
  const newlySeenEntities = new Map<string, number>();

  return {
    className(entity: EntranceEntity, id: string, source: ContentSource): string {
      const key = entityKey(entity, id);

      if (existingEntities.has(key)) {
        return "";
      }

      const firstSeenAt = newlySeenEntities.get(key);
      if (firstSeenAt === undefined) {
        newlySeenEntities.set(key, now());
      } else if (now() - firstSeenAt > REMOUNT_WINDOW_MS) {
        return "";
      }

      return ` motion-enter motion-enter--${entity}${
        source === "agent" ? " motion-enter--agent" : ""
      }`;
    },
  };
}
