import { decisionStore } from "../store/decisionStore";
import type { DecisionStore } from "../store/decisionStore";
import type { ThoughtWeight } from "../types";
import type { JsonSchema, WebMcpTool } from "./types";

type Input = Record<string, unknown>;

const deskIdProperty = {
  desk_id: {
    type: "string",
    description: "Optional desk ID. Omit it to use the human's currently open desk.",
  },
};

const weightProperty = {
  type: "integer",
  enum: [1, 2, 3, 4, 5],
  default: 3,
  description: "Importance from 1 (low) to 5 (high).",
};

function schema(
  properties: Record<string, Record<string, unknown>>,
  required: string[] = [],
): JsonSchema {
  return { type: "object", properties, required, additionalProperties: false };
}

function stringArg(input: Input, key: string): string {
  const value = input[key];
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  return value;
}

function optionalStringArg(input: Input, key: string): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  return value;
}

function resolveDeskId(store: DecisionStore, input: Input): string {
  const deskId = optionalStringArg(input, "desk_id") ?? store.getState().currentDeskId;
  if (!deskId) throw new Error("No current desk is open.");
  return deskId;
}

function weightArg(input: Input): ThoughtWeight | undefined {
  const value = input.weight;
  return value === undefined ? undefined : (value as ThoughtWeight);
}

function thoughtLocation(input: Input, store: DecisionStore) {
  return {
    deskId: resolveDeskId(store, input),
    optionId: stringArg(input, "option_id"),
    thoughtId: stringArg(input, "thought_id"),
  };
}

export function createMutationTools(store: DecisionStore = decisionStore): WebMcpTool[] {
  const optionIdentity = {
    ...deskIdProperty,
    option_id: { type: "string", description: "The option ID." },
  };
  const thoughtIdentity = {
    ...optionIdentity,
    thought_id: { type: "string", description: "The thought ID." },
  };

  return [
    {
      name: "create_desk",
      title: "Create Decision Desk",
      description:
        "Create a new decision desk without changing the desk currently open by the human. Initial options are marked as agent suggestions.",
      inputSchema: schema(
        {
          title: { type: "string", description: "The decision question or title." },
          initial_option_names: {
            type: "array",
            items: { type: "string" },
            description: "Optional suggested starting options.",
          },
        },
        ["title"],
      ),
      execute: (input: Input) => ({
        desk: store.createDesk({
          title: stringArg(input, "title"),
          initialOptionNames: Array.isArray(input.initial_option_names)
            ? (input.initial_option_names as string[])
            : undefined,
          optionSource: "agent",
          open: false,
        }),
      }),
    },
    {
      name: "rename_desk",
      title: "Rename Decision Desk",
      description: "Rename a decision desk while preserving all of its contents.",
      inputSchema: schema(
        {
          ...deskIdProperty,
          title: { type: "string", description: "The new decision title." },
        },
        ["title"],
      ),
      execute: (input: Input) => ({
        desk: store.renameDesk(resolveDeskId(store, input), stringArg(input, "title")),
      }),
    },
    {
      name: "add_option",
      title: "Suggest Decision Option",
      description:
        "Add an alternative as an agent suggestion. Add only a plausible option; do not imply the human selected it.",
      inputSchema: schema(
        { ...deskIdProperty, name: { type: "string", description: "Suggested option name." } },
        ["name"],
      ),
      execute: (input: Input) => ({
        option: store.addOption({
          deskId: resolveDeskId(store, input),
          name: stringArg(input, "name"),
          source: "agent",
        }),
      }),
    },
    {
      name: "rename_option",
      title: "Rename Decision Option",
      description: "Rename an existing option without changing its thoughts.",
      inputSchema: schema(
        { ...optionIdentity, name: { type: "string", description: "New option name." } },
        ["option_id", "name"],
      ),
      execute: (input: Input) => ({
        option: store.renameOption(
          resolveDeskId(store, input),
          stringArg(input, "option_id"),
          stringArg(input, "name"),
        ),
      }),
    },
    {
      name: "remove_option",
      title: "Remove Decision Option",
      description:
        "Remove an option. Avoid removing human-created options or any option containing pinned judgment unless the human explicitly asks.",
      inputSchema: schema(optionIdentity, ["option_id"]),
      execute: (input: Input) => ({
        removed_option: store.removeOption(
          resolveDeskId(store, input),
          stringArg(input, "option_id"),
        ),
      }),
    },
    ...(["pro", "con"] as const).map(
      (type): WebMcpTool => ({
        name: type === "pro" ? "add_pro" : "add_con",
        title: type === "pro" ? "Add Known Pro" : "Add Known Con",
        description:
          `Add an agent-created ${type} only when it is supported by known conversation context. ` +
          "If the information is unknown or merely worth checking, use add_consideration instead.",
        inputSchema: schema(
          {
            ...optionIdentity,
            text: { type: "string", description: `Context-supported ${type} text.` },
            weight: weightProperty,
          },
          ["option_id", "text"],
        ),
        execute: (input: Input) => {
          const thoughtInput = {
            deskId: resolveDeskId(store, input),
            optionId: stringArg(input, "option_id"),
            text: stringArg(input, "text"),
            weight: weightArg(input),
            source: "agent" as const,
          };
          return { thought: type === "pro" ? store.addPro(thoughtInput) : store.addCon(thoughtInput) };
        },
      }),
    ),
    {
      name: "edit_thought",
      title: "Edit Existing Thought",
      description:
        "Edit a thought's wording while preserving provenance. Do not alter pinned human judgment unless explicitly requested.",
      inputSchema: schema(
        { ...thoughtIdentity, text: { type: "string", description: "Replacement thought text." } },
        ["option_id", "thought_id", "text"],
      ),
      execute: (input: Input) => {
        const location = thoughtLocation(input, store);
        return {
          thought: store.editThought(
            location.deskId,
            location.optionId,
            location.thoughtId,
            stringArg(input, "text"),
          ),
        };
      },
    },
    {
      name: "remove_thought",
      title: "Remove Existing Thought",
      description:
        "Remove a thought. Never remove pinned human judgment unless the human explicitly requests it.",
      inputSchema: schema(thoughtIdentity, ["option_id", "thought_id"]),
      execute: (input: Input) => {
        const location = thoughtLocation(input, store);
        return { removed_thought: store.removeThought(location.deskId, location.optionId, location.thoughtId) };
      },
    },
    {
      name: "set_thought_weight",
      title: "Set Thought Importance",
      description:
        "Set a thought's 1–5 importance. Respect human-set and pinned priorities unless a change is explicitly requested.",
      inputSchema: schema(
        { ...thoughtIdentity, weight: weightProperty },
        ["option_id", "thought_id", "weight"],
      ),
      execute: (input: Input) => {
        const location = thoughtLocation(input, store);
        return {
          thought: store.setThoughtWeight(
            location.deskId,
            location.optionId,
            location.thoughtId,
            input.weight as ThoughtWeight,
          ),
        };
      },
    },
    ...(["pin", "unpin"] as const).map(
      (action): WebMcpTool => ({
        name: `${action}_thought`,
        title: action === "pin" ? "Pin Human Judgment" : "Unpin Human Judgment",
        description:
          action === "pin"
            ? "Pin a thought only when the human explicitly identifies it as personally important or protected."
            : "Unpin a thought only at the human's explicit request.",
        inputSchema: schema(thoughtIdentity, ["option_id", "thought_id"]),
        execute: (input: Input) => {
          const location = thoughtLocation(input, store);
          return {
            thought:
              action === "pin"
                ? store.pinThought(location.deskId, location.optionId, location.thoughtId)
                : store.unpinThought(location.deskId, location.optionId, location.thoughtId),
          };
        },
      }),
    ),
    {
      name: "add_consideration",
      title: "Add Unresolved Consideration",
      description:
        "Add an agent-created inbox question for missing, unknown, or unresolved information. This is the correct tool when a possible pro or con is not yet known to be true.",
      inputSchema: schema(
        {
          ...deskIdProperty,
          text: { type: "string", description: "A concise unresolved question or consideration." },
          related_option_ids: {
            type: "array",
            items: { type: "string" },
            description: "Optional option IDs this uncertainty relates to.",
          },
        },
        ["text"],
      ),
      execute: (input: Input) => ({
        consideration: store.addConsideration({
          deskId: resolveDeskId(store, input),
          text: stringArg(input, "text"),
          source: "agent",
          relatedOptionIds: Array.isArray(input.related_option_ids)
            ? (input.related_option_ids as string[])
            : undefined,
        }),
      }),
    },
    {
      name: "remove_consideration",
      title: "Remove Consideration",
      description: "Remove an unresolved consideration when it is irrelevant or explicitly dismissed.",
      inputSchema: schema(
        {
          ...deskIdProperty,
          consideration_id: { type: "string", description: "The consideration ID." },
        },
        ["consideration_id"],
      ),
      execute: (input: Input) => ({
        removed_consideration: store.removeConsideration(
          resolveDeskId(store, input),
          stringArg(input, "consideration_id"),
        ),
      }),
    },
  ];
}
