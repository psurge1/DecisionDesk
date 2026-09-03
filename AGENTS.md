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



## UI Design Principle: Minimalism

DecisionDesk should feel calm, focused, and intentionally minimal.

The user's decision content must dominate the interface. Application chrome, controls, metadata, decoration, and explanatory text should recede into the background.

Default to removing rather than adding UI.

* Do not display information simply because it exists.
* Avoid nested cards and excessive containers.
* Avoid excessive badges, labels, helper text, icons, borders, and decorative elements.
* Prefer whitespace and typography for hierarchy.
* Prefer contextual controls over permanently visible controls when practical.
* Every persistent UI element must justify the attention and space it consumes.
* Preserve the physical desk/stationery metaphor through a few deliberate details, not decorative clutter.

Target aesthetic: an elegant desk with a few important pieces of paper, not a desk covered in stationery.
