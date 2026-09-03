import type {
  AppState,
  Consideration,
  ContentSource,
  Desk,
  Option,
  Thought,
  ThoughtType,
  ThoughtWeight,
} from "../types";

export const APP_STATE_STORAGE_KEY = "decisiondesk.app-state.v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isContentSource(value: unknown): value is ContentSource {
  return value === "human" || value === "agent";
}

function isThoughtType(value: unknown): value is ThoughtType {
  return value === "pro" || value === "con";
}

function isThoughtWeight(value: unknown): value is ThoughtWeight {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function hasUniqueIds(items: Array<{ id: string }>): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function isThought(value: unknown): value is Thought {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.text) &&
    isThoughtType(value.type) &&
    isThoughtWeight(value.weight) &&
    typeof value.pinned === "boolean" &&
    isContentSource(value.source)
  );
}

function isOption(value: unknown): value is Option {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    !isContentSource(value.source) ||
    !Array.isArray(value.thoughts) ||
    !value.thoughts.every(isThought)
  ) {
    return false;
  }

  return hasUniqueIds(value.thoughts);
}

function isConsideration(value: unknown): value is Consideration {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.text) ||
    !isContentSource(value.source)
  ) {
    return false;
  }

  if (value.relatedOptionIds === undefined) {
    return true;
  }

  return (
    Array.isArray(value.relatedOptionIds) &&
    value.relatedOptionIds.every(isNonEmptyString) &&
    new Set(value.relatedOptionIds).size === value.relatedOptionIds.length
  );
}

function isDesk(value: unknown): value is Desk {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.createdAt) ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    !Array.isArray(value.options) ||
    !value.options.every(isOption) ||
    !Array.isArray(value.considerations) ||
    !value.considerations.every(isConsideration)
  ) {
    return false;
  }

  if (!hasUniqueIds(value.options) || !hasUniqueIds(value.considerations)) {
    return false;
  }

  const optionIds = new Set(value.options.map((option) => option.id));
  return value.considerations.every((consideration) =>
    consideration.relatedOptionIds?.every((optionId) => optionIds.has(optionId)) ?? true,
  );
}

export function parseAppState(value: unknown): AppState | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.desks) ||
    !value.desks.every(isDesk) ||
    !hasUniqueIds(value.desks) ||
    !(value.currentDeskId === null || typeof value.currentDeskId === "string")
  ) {
    return null;
  }

  const desks = value.desks;
  const currentDeskId = desks.some((desk) => desk.id === value.currentDeskId)
    ? value.currentDeskId
    : (desks[0]?.id ?? null);

  return structuredClone({ desks, currentDeskId });
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadAppState(storage: StorageLike | null = getBrowserStorage()): AppState | null {
  if (!storage) {
    return null;
  }

  try {
    const savedState = storage.getItem(APP_STATE_STORAGE_KEY);
    return savedState ? parseAppState(JSON.parse(savedState)) : null;
  } catch {
    return null;
  }
}

export function saveAppState(
  state: AppState,
  storage: StorageLike | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
