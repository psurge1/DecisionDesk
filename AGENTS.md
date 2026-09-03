# DecisionDesk

DecisionDesk is a shared visual decision-making workspace for humans and AI agents.

## Product invariants

- A user may have multiple Desks.
- Each Desk represents one decision.
- A Desk contains Options.
- Options contain Pros and Cons represented as sticky notes.
- Thoughts have weights from 1-5.
- Humans may pin important judgments.
- Agent-created content must preserve agent provenance.
- Unknown information should become an Inbox consideration, not an invented Pro or Con.
- Both the human UI and WebMCP tools operate on the same application state.

## Architecture

- React + TypeScript.
- No backend.
- Persist locally.
- UI and WebMCP MUST call the same central action layer.
- Do not duplicate business logic inside WebMCP handlers.

## Scope

Do not add:
- authentication
- database
- embedded chatbot
- OpenAI API calls
- unnecessary external APIs
- unrelated features

## Validation

Run the build and relevant tests after changes.

