# DecisionDesk

DecisionDesk is a shared reasoning surface for people and their agents. A person brings taste, priorities, intuition, and hard boundaries; an agent can inspect the same live decision, identify missing considerations, suggest alternatives, and structure tradeoffs without taking control away from the person making the decision.

The app is a small client-only React application. It has no account system, backend, database, embedded chatbot, or external research integration.

## What it supports

- Multiple decision desks stored locally in the browser
- Horizontally comparable options with vertically stacked pros and cons
- Importance weights from 1–5 and human-controlled pins
- An inbox for unresolved considerations and missing information
- Visible provenance for agent-created options, thoughts, and considerations
- Deterministic pro-minus-con tradeoff and lean summaries
- 21 WebMCP tools that read and mutate the same live state as the human UI

## Trust model

**Known information becomes a sticky. Missing information becomes an inbox item.**

WebMCP tool descriptions reinforce three rules:

1. Add a pro or con only when it is supported by information already known in context.
2. Put unknown or unresolved information in considerations instead of inventing a fact.
3. Respect pinned human judgment and change it only when the human explicitly asks.

Agent-created content is always stored with `source: "agent"` and identified in the interface. Human actions remain authoritative: a person can remove suggestions, edit weights, pin judgments, and resolve or dismiss considerations.

## Architecture

```text
Human UI ─────┐
              ├──> DecisionStore actions ──> live state ──> localStorage
WebMCP tools ─┘
```

UI components and WebMCP handlers do not carry separate mutation logic. Both call the same `DecisionStore` methods, and every store publication updates React subscribers and browser persistence.

The WebMCP integration uses the browser's imperative `document.modelContext.registerTool()` API. Registration is skipped gracefully in browsers that do not expose `document.modelContext`; all human functionality still works.

### Read tools

`get_desks`, `get_current_desk`, `get_options`, `get_thoughts`, `get_considerations`, `get_tradeoffs`, and `get_lean`.

### Mutation tools

`create_desk`, `rename_desk`, `add_option`, `rename_option`, `remove_option`, `add_pro`, `add_con`, `edit_thought`, `remove_thought`, `set_thought_weight`, `pin_thought`, `unpin_thought`, `add_consideration`, and `remove_consideration`.

## Run locally

Requirements: a current Node.js release and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The seeded apartment decision can be restored at any time with **Reset demo**.

## Validate

```bash
npx tsc -b
npm run test
npm run build
npm run preview
```

There is no separate lint script. The tests compile the WebMCP modules through Vite and verify registration, schemas, trust guidance, shared-store mutation behavior, provenance, and fresh reads after state changes.

## Deploy

DecisionDesk builds to static assets and can be hosted without a server runtime.

For Cloudflare Pages:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Environment variables: none

Any static host that serves `dist/index.html` over HTTPS is also suitable. After deployment, verify the complete workflow in a WebMCP-capable target browser; WebMCP is an emerging browser API and ordinary browsers may run the human UI without exposing agent tools.

## Project structure

- `src/store/` — shared state, actions, persistence, and deterministic analysis
- `src/components/` — human decision workspace
- `src/webmcp/` — tool schemas, registration, trust guidance, and handlers
- `src/data/` — seeded demonstration desk
- `tests/` — focused WebMCP/shared-state tests
- `SUBMISSION.md` — launch checklist and a timed demo script

## License

MIT — see [LICENSE](LICENSE).
