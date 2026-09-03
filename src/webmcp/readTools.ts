import { decisionStore } from "../store/decisionStore";
import type { DecisionStore } from "../store/decisionStore";
import type { Desk } from "../types";
import type { WebMcpTool } from "./types";

type DeskInput = { desk_id?: string };
type ThoughtsInput = DeskInput & { option_id?: string };

const optionalDeskSchema = {
  type: "object" as const,
  properties: {
    desk_id: {
      type: "string",
      description: "Optional desk ID. Omit it to use the human's currently open desk.",
    },
  },
  additionalProperties: false,
};

function resolveDesk(store: DecisionStore, deskId?: string): Desk {
  const state = store.getState();
  const resolvedId = deskId ?? state.currentDeskId;
  const desk = state.desks.find((candidate) => candidate.id === resolvedId);

  if (!desk) {
    throw new Error(deskId ? `Desk not found: ${deskId}` : "No current desk is open.");
  }

  return desk;
}

export function createReadTools(store: DecisionStore = decisionStore): WebMcpTool[] {
  return [
    {
      name: "get_desks",
      title: "List Decision Desks",
      description: "List the user's decision desks with concise counts and current-desk status.",
      inputSchema: { type: "object", additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => ({
        desks: store.getDesks().map((desk) => ({
          id: desk.id,
          title: desk.title,
          option_count: desk.options.length,
          thought_count: desk.options.reduce((total, option) => total + option.thoughts.length, 0),
          consideration_count: desk.considerations.length,
          is_current: desk.id === store.getState().currentDeskId,
        })),
      }),
    },
    {
      name: "get_current_desk",
      title: "Read Current Decision Desk",
      description:
        "Read the exact live decision currently open by the human, including option and thought provenance, weights, pins, and unresolved considerations.",
      inputSchema: { type: "object", additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => ({ current_desk: structuredClone(store.getCurrentDesk()) }),
    },
    {
      name: "get_options",
      title: "Read Decision Options",
      description: "Read all options and their provenance for a desk. Defaults to the current desk.",
      inputSchema: optionalDeskSchema,
      annotations: { readOnlyHint: true },
      execute: ({ desk_id }: DeskInput) => {
        const desk = resolveDesk(store, desk_id);
        return {
          desk_id: desk.id,
          options: desk.options.map(({ id, name, source, thoughts }) => ({
            id,
            name,
            source,
            thought_count: thoughts.length,
          })),
        };
      },
    },
    {
      name: "get_thoughts",
      title: "Read Pros and Cons",
      description:
        "Read live pros and cons with option IDs, 1–5 weights, pin protection, and human or agent provenance.",
      inputSchema: {
        type: "object",
        properties: {
          ...optionalDeskSchema.properties,
          option_id: { type: "string", description: "Optional option ID to filter thoughts." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: ({ desk_id, option_id }: ThoughtsInput) => {
        const desk = resolveDesk(store, desk_id);
        const options = option_id
          ? desk.options.filter((option) => option.id === option_id)
          : desk.options;

        if (option_id && !options.length) {
          throw new Error(`Option not found in desk: ${option_id}`);
        }

        return {
          desk_id: desk.id,
          thoughts: options.flatMap((option) =>
            option.thoughts.map((thought) => ({
              option_id: option.id,
              option_name: option.name,
              ...structuredClone(thought),
            })),
          ),
        };
      },
    },
    {
      name: "get_considerations",
      title: "Read Open Considerations",
      description:
        "Read unresolved questions or missing information. These are uncertainties, not established pros or cons.",
      inputSchema: optionalDeskSchema,
      annotations: { readOnlyHint: true },
      execute: ({ desk_id }: DeskInput) => {
        const desk = resolveDesk(store, desk_id);
        return { desk_id: desk.id, considerations: structuredClone(desk.considerations) };
      },
    },
    {
      name: "get_tradeoffs",
      title: "Read Decision Tradeoffs",
      description:
        "Read deterministic pro-minus-con weight summaries and strongest reasons. Scores are directional signals, not objective answers.",
      inputSchema: optionalDeskSchema,
      annotations: { readOnlyHint: true },
      execute: ({ desk_id }: DeskInput) => {
        const desk = resolveDesk(store, desk_id);
        return { tradeoffs: store.getTradeoffSummary(desk.id) };
      },
    },
    {
      name: "get_lean",
      title: "Read Current Lean",
      description:
        "Read the current deterministic lean or tie based on weighted pros and cons. Treat it as guidance, never certainty.",
      inputSchema: optionalDeskSchema,
      annotations: { readOnlyHint: true },
      execute: ({ desk_id }: DeskInput) => {
        const desk = resolveDesk(store, desk_id);
        return { desk_id: desk.id, lean: store.getDeskLean(desk.id) };
      },
    },
  ];
}
