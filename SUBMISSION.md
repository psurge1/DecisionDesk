# DecisionDesk submission kit

This file contains the remaining publishing fields and a ready-to-record demo outline. Replace bracketed values only after the corresponding public asset exists.

## Publication checklist

- Live app: `[PUBLIC_LIVE_URL]`
- Source repository: `[PUBLIC_REPOSITORY_URL]`
- Demo video with audio: `[PUBLIC_VIDEO_URL]`
- License: MIT (`LICENSE`)
- Production build command: `npm run build`
- Static output: `dist`
- Required environment variables: none

Before publishing, run the smoke test at the end of this file against the public live URL.

## Short description

DecisionDesk is a shared reasoning surface where people and AI agents work on the same live decision. Humans record their options, priorities, and protected judgments as weighted notes. Through WebMCP, an external agent can inspect that exact state, add context-supported pros and cons, suggest alternatives, and capture unknowns as considerations. Every agent contribution keeps visible provenance, and every human override is immediately reflected in the agent's next read.

## WebMCP explanation

DecisionDesk registers 21 client-side tools through `document.modelContext.registerTool()`: seven read tools and fourteen mutation tools. The tools inspect and invoke the same `DecisionStore` used by React components, so there is no parallel agent database or duplicated business logic.

This shared action path enables the core collaboration loop:

1. The agent reads the desk currently open by the human.
2. The agent adds a suggestion or unresolved consideration.
3. The live React UI updates from the shared store publication.
4. The human edits, pins, resolves, dismisses, or removes that contribution.
5. A later agent read observes the human's updated state.

Tool descriptions encode the product's trust rule: established context may become a pro or con; missing information must remain a consideration. Pinned human judgments should not be changed without an explicit request.

## Implementation summary

- React and TypeScript, built with Vite
- Client-only state with `localStorage` persistence
- Multiple desks, dynamic options, weighted pros/cons, pins, and considerations
- Horizontal option comparison with readable minimum column widths
- Deterministic weighted tradeoff summaries; no probabilistic ranking claim
- Human/agent provenance in the data model and interface
- Shared UI/WebMCP store and action layer
- No backend, authentication, database, embedded model, or external API

## Demo video outline — 2:35 target

### 0:00–0:18 — Problem and product

Show the seeded apartment decision.

Voiceover: “DecisionDesk is a shared reasoning surface for people and their agents. The person supplies preferences and hard boundaries; the agent helps structure what is known and identify what is still missing.”

### 0:18–0:40 — Human decision surface

Point out horizontal options, vertically stacked pros and cons, 1–5 weights, a pinned judgment, and the considerations slips. Briefly show the lean summary as a deterministic signal rather than an answer.

### 0:40–1:00 — Agent reads live state

Ask the external agent to inspect the current desk, its options, thoughts, weights, pins, open considerations, and tradeoffs. Show that the response references the visible decision.

Suggested prompt:

> Read my current DecisionDesk. Summarize the options, strongest tradeoffs, pinned judgments, and unresolved considerations. Do not add anything yet.

### 1:00–1:32 — Agent contributes carefully

Ask the agent to add one useful missing consideration, one suggested alternative, and one pro or con only if justified by the context already provided.

Suggested prompt:

> Add one unresolved question that would materially affect this choice. Suggest one plausible alternative option. Add a pro or con only if the fact is already supported by the desk; otherwise keep it as a consideration.

Show each addition appear immediately in the open UI with Agent provenance.

### 1:32–2:05 — Human override

Remove the suggested option, change a thought's weight, pin an important human judgment, resolve one consideration into a sticky, and dismiss another. Keep this sequence brisk and visible.

Voiceover: “The agent contributes structure, but the person remains in control. Pins protect personal judgment, and unknowns do not become invented facts.”

### 2:05–2:25 — Agent observes the override

Suggested prompt:

> Read the desk again. Tell me what changed since your last read and update the tradeoff summary. Respect the pinned judgment.

Show that the agent sees the removed suggestion, new weight and pin, and resolved or dismissed considerations.

### 2:25–2:35 — Close

Voiceover: “DecisionDesk gives people and agents one live, trustworthy place to think through a choice together.”

## Public-release smoke test

1. Open the production URL in the target WebMCP-capable browser.
2. Confirm the seeded desk renders without console errors.
3. Create and reopen a second desk.
4. Add options until horizontal scrolling appears without narrow columns.
5. Add, edit, weight, pin, flip, and remove thoughts.
6. Add, resolve, and dismiss considerations.
7. Reload and confirm local state persists.
8. Confirm all 21 WebMCP tools are discovered.
9. Run the read → agent mutation → human override → agent reread sequence above.
10. Reset the demo and confirm the seeded desk returns.
