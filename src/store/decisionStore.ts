import { demoAppState } from "../data/demoDesk";
import type { AppState, Consideration, ContentSource, Desk, Option, Thought, ThoughtWeight } from "../types";
import {
  getDeskLean as deriveDeskLean,
  getOpenConsiderationCount as deriveOpenConsiderationCount,
  getOptionScore as deriveOptionScore,
  getStrongestCons as deriveStrongestCons,
  getStrongestPros as deriveStrongestPros,
  getTradeoffSummary as deriveTradeoffSummary,
} from "./analysis";
import { loadAppState, saveAppState } from "./persistence";

type Listener = () => void;

export type DecisionStoreOptions = {
  onStateChange?: (state: AppState) => void;
  resetState?: AppState;
};

export type CreateDeskInput = {
  title: string;
  initialOptionNames?: string[];
  optionSource?: ContentSource;
  open?: boolean;
};

export type AddOptionInput = {
  deskId: string;
  name: string;
  source?: ContentSource;
};

export type AddThoughtInput = {
  deskId: string;
  optionId: string;
  text: string;
  weight?: ThoughtWeight;
  source?: ContentSource;
  pinned?: boolean;
};

export type AddConsiderationInput = {
  deskId: string;
  text: string;
  source?: ContentSource;
  relatedOptionIds?: string[];
};

export type ResolveConsiderationInput = {
  deskId: string;
  considerationId: string;
  optionId: string;
  text: string;
  weight?: ThoughtWeight;
  source?: ContentSource;
  pinned?: boolean;
};

export class DecisionStoreError extends Error {
  constructor(
    public readonly code: "invalid_input" | "not_found",
    message: string,
  ) {
    super(message);
    this.name = "DecisionStoreError";
  }
}

function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function requireText(value: string, fieldName: string): string {
  const text = value.trim();

  if (!text) {
    throw new DecisionStoreError("invalid_input", `${fieldName} cannot be empty.`);
  }

  return text;
}

function requireWeight(value: number): ThoughtWeight {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new DecisionStoreError("invalid_input", "Thought weight must be an integer from 1 to 5.");
  }

  return value as ThoughtWeight;
}

export function createDecisionStore(initialState: AppState, options: DecisionStoreOptions = {}) {
  let state = structuredClone(initialState);
  const listeners = new Set<Listener>();

  const getState = (): AppState => state;

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const publish = (nextState: AppState): void => {
    state = nextState;
    options.onStateChange?.(state);
    listeners.forEach((listener) => listener());
  };

  const requireDesk = (deskId?: string | null): Desk => {
    const resolvedDeskId = deskId ?? state.currentDeskId;
    const desk = state.desks.find((candidate) => candidate.id === resolvedDeskId);

    if (!desk) {
      throw new DecisionStoreError("not_found", "Desk not found.");
    }

    return desk;
  };

  const requireOption = (desk: Desk, optionId: string): Option => {
    const option = desk.options.find((candidate) => candidate.id === optionId);

    if (!option) {
      throw new DecisionStoreError("not_found", "Option not found.");
    }

    return option;
  };

  const requireThought = (option: Option, thoughtId: string): Thought => {
    const thought = option.thoughts.find((candidate) => candidate.id === thoughtId);

    if (!thought) {
      throw new DecisionStoreError("not_found", "Thought not found.");
    }

    return thought;
  };

  const updateDesk = (deskId: string, update: (desk: Desk) => Desk): Desk => {
    let updatedDesk: Desk | null = null;
    const desks = state.desks.map((desk) => {
      if (desk.id !== deskId) {
        return desk;
      }

      updatedDesk = update(desk);
      return updatedDesk;
    });

    if (!updatedDesk) {
      throw new DecisionStoreError("not_found", "Desk not found.");
    }

    publish({ ...state, desks });
    return updatedDesk;
  };

  const updateOption = (
    deskId: string,
    optionId: string,
    update: (option: Option) => Option,
  ): Option => {
    requireOption(requireDesk(deskId), optionId);
    let updatedOption: Option | null = null;

    updateDesk(deskId, (desk) => ({
      ...desk,
      options: desk.options.map((option) => {
        if (option.id !== optionId) {
          return option;
        }

        updatedOption = update(option);
        return updatedOption;
      }),
    }));

    if (!updatedOption) {
      throw new DecisionStoreError("not_found", "Option not found.");
    }

    return updatedOption;
  };

  const updateThought = (
    deskId: string,
    optionId: string,
    thoughtId: string,
    update: (thought: Thought) => Thought,
  ): Thought => {
    requireThought(requireOption(requireDesk(deskId), optionId), thoughtId);
    let updatedThought: Thought | null = null;

    updateOption(deskId, optionId, (option) => ({
      ...option,
      thoughts: option.thoughts.map((thought) => {
        if (thought.id !== thoughtId) {
          return thought;
        }

        updatedThought = update(thought);
        return updatedThought;
      }),
    }));

    if (!updatedThought) {
      throw new DecisionStoreError("not_found", "Thought not found.");
    }

    return updatedThought;
  };

  const addThought = (input: AddThoughtInput, type: Thought["type"]): Thought => {
    const thought: Thought = {
      id: createId("thought"),
      text: requireText(input.text, "Thought text"),
      type,
      weight: requireWeight(input.weight ?? 3),
      pinned: input.pinned ?? false,
      source: input.source ?? "human",
    };

    updateOption(input.deskId, input.optionId, (option) => ({
      ...option,
      thoughts: [...option.thoughts, thought],
    }));

    return thought;
  };

  const resolveConsideration = (
    input: ResolveConsiderationInput,
    type: Thought["type"],
  ): Thought => {
    const thought: Thought = {
      id: createId("thought"),
      text: requireText(input.text, "Resolved thought text"),
      type,
      weight: requireWeight(input.weight ?? 3),
      pinned: input.pinned ?? false,
      source: input.source ?? "human",
    };

    updateDesk(input.deskId, (desk) => {
      requireOption(desk, input.optionId);

      if (!desk.considerations.some((consideration) => consideration.id === input.considerationId)) {
        throw new DecisionStoreError("not_found", "Consideration not found.");
      }

      return {
        ...desk,
        options: desk.options.map((option) =>
          option.id === input.optionId
            ? { ...option, thoughts: [...option.thoughts, thought] }
            : option,
        ),
        considerations: desk.considerations.filter(
          (consideration) => consideration.id !== input.considerationId,
        ),
      };
    });

    return thought;
  };

  return {
    getState,
    subscribe,

    getDesks: (): Desk[] => state.desks,

    getCurrentDesk: (): Desk | null =>
      state.desks.find((desk) => desk.id === state.currentDeskId) ?? null,

    resetDemo: (): AppState => {
      const resetState = structuredClone(options.resetState ?? demoAppState);
      publish(resetState);
      return resetState;
    },

    createDesk: (input: CreateDeskInput): Desk => {
      const optionSource = input.optionSource ?? "human";
      const desk: Desk = {
        id: createId("desk"),
        title: requireText(input.title, "Desk title"),
        createdAt: new Date().toISOString(),
        options: (input.initialOptionNames ?? []).map((name) => ({
          id: createId("option"),
          name: requireText(name, "Option name"),
          source: optionSource,
          thoughts: [],
        })),
        considerations: [],
      };

      publish({
        desks: [...state.desks, desk],
        currentDeskId: input.open === false ? state.currentDeskId : desk.id,
      });

      return desk;
    },

    renameDesk: (deskId: string, title: string): Desk =>
      updateDesk(deskId, (desk) => ({ ...desk, title: requireText(title, "Desk title") })),

    deleteDesk: (deskId: string): Desk => {
      const desk = requireDesk(deskId);
      const desks = state.desks.filter((candidate) => candidate.id !== deskId);
      const currentDeskId =
        state.currentDeskId === deskId ? (desks[0]?.id ?? null) : state.currentDeskId;

      publish({ desks, currentDeskId });
      return desk;
    },

    openDesk: (deskId: string): Desk => {
      const desk = requireDesk(deskId);

      if (state.currentDeskId !== deskId) {
        publish({ ...state, currentDeskId: deskId });
      }

      return desk;
    },

    addOption: (input: AddOptionInput): Option => {
      const option: Option = {
        id: createId("option"),
        name: requireText(input.name, "Option name"),
        source: input.source ?? "human",
        thoughts: [],
      };

      updateDesk(input.deskId, (desk) => ({ ...desk, options: [...desk.options, option] }));
      return option;
    },

    renameOption: (deskId: string, optionId: string, name: string): Option =>
      updateOption(deskId, optionId, (option) => ({
        ...option,
        name: requireText(name, "Option name"),
      })),

    removeOption: (deskId: string, optionId: string): Option => {
      const desk = requireDesk(deskId);
      const option = requireOption(desk, optionId);

      updateDesk(deskId, (currentDesk) => ({
        ...currentDesk,
        options: currentDesk.options.filter((candidate) => candidate.id !== optionId),
        considerations: currentDesk.considerations.map((consideration) =>
          consideration.relatedOptionIds
            ? {
                ...consideration,
                relatedOptionIds: consideration.relatedOptionIds.filter(
                  (relatedOptionId) => relatedOptionId !== optionId,
                ),
              }
            : consideration,
        ),
      }));

      return option;
    },

    addPro: (input: AddThoughtInput): Thought => addThought(input, "pro"),

    addCon: (input: AddThoughtInput): Thought => addThought(input, "con"),

    editThought: (deskId: string, optionId: string, thoughtId: string, text: string): Thought =>
      updateThought(deskId, optionId, thoughtId, (thought) => ({
        ...thought,
        text: requireText(text, "Thought text"),
      })),

    removeThought: (deskId: string, optionId: string, thoughtId: string): Thought => {
      const desk = requireDesk(deskId);
      const option = requireOption(desk, optionId);
      const thought = requireThought(option, thoughtId);

      updateOption(deskId, optionId, (currentOption) => ({
        ...currentOption,
        thoughts: currentOption.thoughts.filter((candidate) => candidate.id !== thoughtId),
      }));

      return thought;
    },

    setThoughtWeight: (
      deskId: string,
      optionId: string,
      thoughtId: string,
      weight: ThoughtWeight,
    ): Thought =>
      updateThought(deskId, optionId, thoughtId, (thought) => ({
        ...thought,
        weight: requireWeight(weight),
      })),

    pinThought: (deskId: string, optionId: string, thoughtId: string): Thought =>
      updateThought(deskId, optionId, thoughtId, (thought) => ({ ...thought, pinned: true })),

    unpinThought: (deskId: string, optionId: string, thoughtId: string): Thought =>
      updateThought(deskId, optionId, thoughtId, (thought) => ({ ...thought, pinned: false })),

    moveThoughtToOption: (
      deskId: string,
      sourceOptionId: string,
      targetOptionId: string,
      thoughtId: string,
    ): Thought => {
      const desk = requireDesk(deskId);
      const sourceOption = requireOption(desk, sourceOptionId);
      requireOption(desk, targetOptionId);
      const thought = requireThought(sourceOption, thoughtId);

      if (sourceOptionId === targetOptionId) {
        return thought;
      }

      updateDesk(deskId, (currentDesk) => ({
        ...currentDesk,
        options: currentDesk.options.map((option) => {
          if (option.id === sourceOptionId) {
            return {
              ...option,
              thoughts: option.thoughts.filter((candidate) => candidate.id !== thoughtId),
            };
          }

          if (option.id === targetOptionId) {
            return { ...option, thoughts: [...option.thoughts, thought] };
          }

          return option;
        }),
      }));

      return thought;
    },

    flipThoughtType: (deskId: string, optionId: string, thoughtId: string): Thought =>
      updateThought(deskId, optionId, thoughtId, (thought) => ({
        ...thought,
        type: thought.type === "pro" ? "con" : "pro",
      })),

    addConsideration: (input: AddConsiderationInput): Consideration => {
      const desk = requireDesk(input.deskId);
      const relatedOptionIds = input.relatedOptionIds
        ? [...new Set(input.relatedOptionIds)]
        : undefined;

      relatedOptionIds?.forEach((optionId) => requireOption(desk, optionId));

      const consideration: Consideration = {
        id: createId("consideration"),
        text: requireText(input.text, "Consideration text"),
        source: input.source ?? "human",
        ...(relatedOptionIds ? { relatedOptionIds } : {}),
      };

      updateDesk(input.deskId, (currentDesk) => ({
        ...currentDesk,
        considerations: [...currentDesk.considerations, consideration],
      }));

      return consideration;
    },

    removeConsideration: (deskId: string, considerationId: string): Consideration => {
      const desk = requireDesk(deskId);
      const consideration = desk.considerations.find((candidate) => candidate.id === considerationId);

      if (!consideration) {
        throw new DecisionStoreError("not_found", "Consideration not found.");
      }

      updateDesk(deskId, (currentDesk) => ({
        ...currentDesk,
        considerations: currentDesk.considerations.filter(
          (candidate) => candidate.id !== considerationId,
        ),
      }));

      return consideration;
    },

    resolveConsiderationAsPro: (input: ResolveConsiderationInput): Thought =>
      resolveConsideration(input, "pro"),

    resolveConsiderationAsCon: (input: ResolveConsiderationInput): Thought =>
      resolveConsideration(input, "con"),

    getOptionScore: (deskId: string, optionId: string): number =>
      deriveOptionScore(requireOption(requireDesk(deskId), optionId)),

    getDeskLean: (deskId?: string) => deriveDeskLean(requireDesk(deskId)),

    getStrongestPros: (deskId: string, optionId: string, limit = 3): Thought[] =>
      deriveStrongestPros(requireOption(requireDesk(deskId), optionId), limit),

    getStrongestCons: (deskId: string, optionId: string, limit = 3): Thought[] =>
      deriveStrongestCons(requireOption(requireDesk(deskId), optionId), limit),

    getOpenConsiderationCount: (deskId?: string): number =>
      deriveOpenConsiderationCount(requireDesk(deskId)),

    getTradeoffSummary: (deskId?: string) => deriveTradeoffSummary(requireDesk(deskId)),
  };
}

export const decisionStore = createDecisionStore(loadAppState() ?? demoAppState, {
  onStateChange: (state) => {
    saveAppState(state);
  },
  resetState: demoAppState,
});

export type DecisionStore = ReturnType<typeof createDecisionStore>;
