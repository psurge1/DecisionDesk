# DecisionDesk Implementation Plan

## Product Summary

DecisionDesk is a visual decision-making workspace where each decision is represented as a physical-style desk.

Users create multiple desks for different decisions. Each desk contains:
- Options
- Pros
- Cons
- Weighted importance
- Pinned human judgments
- Agent-added suggestions
- An inbox for unresolved considerations

The core product philosophy is:

> Humans provide values, context, intuition, and judgment. Agents contribute structure, missing considerations, alternative options, and reasoning across tradeoffs.

The product must remain fully usable without AI. WebMCP enhances it by allowing an external agent to inspect and modify the same live desk the human is using.

---

# Stage 0 — Project Foundation

## Goal

Create the smallest reliable React + TypeScript foundation.

## Tasks

- Initialize the WebMCP starter project or a lightweight React + TypeScript app.
- Confirm local development works.
- Confirm production build works.
- Remove unused starter code.
- Create a clean project structure:

```text
src/
├── components/
├── data/
├── store/
├── types/
├── utils/
└── webmcp/
```

- Add a simple application shell.
- Add a seeded demo desk for apartment selection.

## Exit Criteria

- `npm run dev` works.
- `npm run build` succeeds.
- The app renders a basic DecisionDesk shell.
- Seeded demo data loads correctly.

---

# Stage 1 — Finalize the Core Data Model

## Goal

Represent the full product cleanly before building UI behavior.

## Core State

```ts
type AppState = {
  desks: Desk[];
  currentDeskId: string | null;
};
```

## Desk

```ts
type Desk = {
  id: string;
  title: string;
  createdAt: string;

  options: Option[];
  considerations: Consideration[];
};
```

## Option

```ts
type Option = {
  id: string;
  name: string;

  source: "human" | "agent";

  thoughts: Thought[];
};
```

## Thought

```ts
type Thought = {
  id: string;
  text: string;

  type: "pro" | "con";

  weight: 1 | 2 | 3 | 4 | 5;

  pinned: boolean;

  source: "human" | "agent";
};
```

## Consideration

```ts
type Consideration = {
  id: string;
  text: string;

  source: "human" | "agent";

  relatedOptionIds?: string[];
};
```

## Design Rules

- Pros and cons are the main reasoning primitive.
- Weight is attached directly to each thought.
- Pinned thoughts represent protected human judgment.
- Agent-created content must preserve provenance.
- Considerations represent unresolved questions or missing information.
- Do not introduce generic criteria tables unless needed later.

## Exit Criteria

- All planned UI interactions can be represented by the model.
- No React-specific UI state is mixed into the persistent data model.
- Seed data can be represented with these types.

---

# Stage 2 — Build the Central Store and Action Layer

## Goal

Create one source of truth shared by both the UI and WebMCP tools.

## Desk Actions

Implement:

```ts
getDesks()
getCurrentDesk()

createDesk()
renameDesk()
deleteDesk()
openDesk()
```

## Option Actions

Implement:

```ts
addOption()
renameOption()
removeOption()
```

## Thought Actions

Implement:

```ts
addPro()
addCon()

editThought()
removeThought()

setThoughtWeight()

pinThought()
unpinThought()

moveThoughtToOption() // optional if easy
flipThoughtType()     // pro <-> con
```

## Consideration Actions

Implement:

```ts
addConsideration()
removeConsideration()

resolveConsiderationAsPro()
resolveConsiderationAsCon()
```

## Derived Analysis

Implement lightweight deterministic helpers:

```ts
getOptionScore()
getDeskLean()
getStrongestPros()
getStrongestCons()
getOpenConsiderationCount()
getTradeoffSummary()
```

Suggested score:

```text
option score =
sum(pro weights)
-
sum(con weights)
```

Use this only as a directional signal, not as an objective answer.

## Important Constraint

All mutations must go through this action layer.

Do not put direct data mutation logic inside React components.

## Exit Criteria

- All state changes work through reusable functions.
- Derived scores update correctly.
- Current desk selection works.
- Human and future WebMCP actions can call the same functions.

---

# Stage 3 — Add Local Persistence

## Goal

Make DecisionDesk usable as a real standalone web app.

## Tasks

- Persist the full `AppState` to `localStorage`.
- Restore state on app startup.
- Add a `Reset Demo` action.
- Handle missing or invalid saved data gracefully.

## Test

1. Create a new desk.
2. Add options.
3. Add pros and cons.
4. Change weights.
5. Pin a thought.
6. Refresh.
7. Confirm all state persists.

## Exit Criteria

- Refresh preserves all desks.
- Current desk restoration works.
- Reset Demo restores known seed data.
- No backend is required.

---

# Stage 4 — Build the Desk Library Home Screen

## Goal

Allow users to manage multiple decisions.

## Visual Concept

The home screen should feel like a collection of folders, notebooks, or cards sitting on a desk.

Each desk card should show:
- Decision title
- Number of options
- Number of thoughts
- Number of unresolved considerations
- Current leading option, if meaningful
- Last updated date, if easy

Example:

```text
WHERE SHOULD I LIVE?
3 options
11 thoughts
3 open questions
Leaning: Parkline
```

## Required Actions

- Create desk
- Open desk
- Rename desk
- Delete desk
- Reset demo

## Create Desk Flow

Use a minimal modal or inline form:

```text
What are you deciding?

[ Which laptop should I buy? ]

Initial options:

[ MacBook Pro ]
[ Framework ]
[ ThinkPad ]

+ Add another option

Create Desk
```

Options may also be added later.

## Exit Criteria

- User can create multiple desks.
- User can switch between them.
- User can rename and delete them.
- Home screen feels like a real product, not a debug menu.

---

# Stage 5 — Build the Individual Desk UI

## Goal

Create the signature physical desk experience.

## Visual Direction

Use:
- Warm wooden desk texture or wood-inspired background
- Sticky-note cards
- Slightly imperfect rotations
- Soft shadows
- Physical stationery metaphor
- Clear but restrained visual hierarchy

Avoid:
- Generic SaaS dashboard styling
- Glassmorphism
- Dense tables
- Excessive analytics panels

## Layout

Each option gets its own section/column.

Example:

```text
WESTVIEW          PARKLINE          THE GROVE

[ pro ]           [ pro ]           [ pro ]
[ pro ]           [ con ]           [ con ]
[ con ]

+ Pro  - Con       + Pro  - Con      + Pro  - Con
```

Also include:

```text
+ Add option
```

## Exit Criteria

- Multiple options fit clearly on desktop.
- Each option has its own visual territory.
- Adding a new option updates the layout dynamically.
- Product identity is immediately recognizable.

---

# Stage 6 — Implement Sticky Note Interaction

## Goal

Make adding and editing thoughts extremely low-friction.

## Sticky Types

### Pro
- Warm yellow / cream
- `+` indicator

### Con
- Pale rose / muted coral
- `-` indicator

## Sticky Contents

Each sticky shows:
- Thought text
- Weight
- Pin state
- Agent provenance if agent-created

Example:

```text
📌
Friends live nearby

● ● ● ● ●
```

## Required Interactions

- Add Pro
- Add Con
- Edit text
- Delete
- Change weight 1–5
- Pin / unpin
- Convert Pro -> Con
- Convert Con -> Pro

## Weight UX

Use five clickable dots:

```text
● ● ● ○ ○
```

Optional enhancement:
- Weight also subtly affects sticky size/emphasis.

Do not make weight changes radically distort layout.

## Adding a Thought

Clicking `+ Pro` or `- Con` should immediately create an editable sticky.

Avoid large modals.

## Exit Criteria

A user can rapidly brainstorm a decision without friction.

---

# Stage 7 — Implement Human Pinning and Provenance

## Goal

Visually distinguish human authority from agent contribution.

## Pin Meaning

A pinned thought means:

> This is something the human explicitly cares about or wants preserved.

Use a pushpin metaphor:

```text
📌
```

## Agent Provenance

Agent-created:
- Options
- Pros
- Cons
- Considerations

should have a subtle provenance indicator such as:

```text
✨
```

or a small label:

```text
Agent suggested
```

Keep this subtle.

## Important Meaning

These indicators should communicate:

```text
📌 = human-protected judgment
✨ = agent contribution
```

## Exit Criteria

- Human-created and agent-created content are distinguishable.
- Pinned items are visually obvious.
- Provenance does not overwhelm the desk.

---

# Stage 8 — Build the Inbox / Consideration Tray

## Goal

Create a shared space for unresolved questions and missing considerations.

## Concept

The inbox is not generated internally by DecisionDesk.

It is primarily populated by the external AI agent through WebMCP.

The inbox represents:

> Things worth thinking about that are not yet known to be a pro or con.

## Example

```text
THINGS TO THINK ABOUT

? How much does parking cost?

? Are utilities included?

? How flexible is the lease?

? How noisy is the area at night?
```

## Consideration Lifecycle

A consideration can be:

1. Added by agent
2. Reviewed by human
3. Resolved into a Pro
4. Resolved into a Con
5. Dismissed

## Resolve Flow

Example:

```text
? Is parking included?

[ Turn into Pro ]
[ Turn into Con ]
[ Dismiss ]
```

The user may optionally choose which option it applies to.

## Design Principle

Use this rule:

> Known information becomes a sticky. Missing information becomes an inbox item.

## Exit Criteria

- Considerations can be added.
- Considerations can reference one or more options.
- Human can dismiss or resolve them.
- Inbox is visually separate from option stickies.

---

# Stage 9 — Add Lightweight Lean and Tradeoff Visualization

## Goal

Show where the user appears to be leaning without pretending the decision is mathematically objective.

## Avoid

Do not display something like:

```text
Parkline is objectively 83.72% better.
```

## Prefer

A qualitative display:

```text
WESTVIEW      PARKLINE      THE GROVE

Strong        Strongest     Mixed
contender     lean          fit

━━━━━━        ━━━━━━━━      ━━━━
```

or:

```text
Parkline

Pros  ███████████████
Cons  ████████

Lean: +5
```

## Right-Side Notepad

Add a physical-style notepad summarizing:

```text
YOUR DECISION

Currently leaning:
★ Parkline

Strongest reasons:
• Friends nearby
• Lower rent

Biggest sacrifice:
• Longer commute

3 open considerations
```

This should use deterministic app state.

No embedded LLM is needed.

## Exit Criteria

- Leading option is visually understandable.
- Strongest pros and cons are surfaced.
- Inbox count is visible.
- UI still feels like a desk, not an analytics dashboard.

---

# Stage 10 — Register WebMCP Read Tools

## Goal

Allow the external AI agent to inspect the exact live desk.

## Implement

```text
get_desks
get_current_desk
get_options
get_thoughts
get_considerations
get_tradeoffs
get_lean
```

## Requirements

- Tools read from the central store.
- Tool output is structured and concise.
- Current human changes must be visible immediately.
- Tool descriptions clearly explain semantics.

## Key Test

1. Human adds a pro.
2. Human pins it.
3. Agent calls `get_current_desk`.
4. Agent sees the new pro and pin state.

## Exit Criteria

- Agent has a full structured view of the current decision.
- Tool reads always reflect current state.

---

# Stage 11 — Register WebMCP Mutation Tools

## Goal

Allow the external agent to contribute directly to the desk.

## Desk Tools

```text
create_desk
rename_desk
```

Do not initially allow the agent to switch the human's current desk unless necessary.

## Option Tools

```text
add_option
rename_option
remove_option
```

Agent-created options must use:

```text
source = "agent"
```

## Thought Tools

```text
add_pro
add_con

edit_thought
remove_thought

set_thought_weight

pin_thought
unpin_thought
```

Agent-created thoughts must use:

```text
source = "agent"
```

## Consideration Tools

```text
add_consideration
remove_consideration
```

## Design Rule

Every WebMCP mutation must call the exact same action layer used by normal UI actions.

Example:

```text
Human UI button ─────┐
                     ├──> addPro(...)
WebMCP tool ─────────┘
```

## Exit Criteria

- Agent can add its own options.
- Agent can add pros.
- Agent can add cons.
- Agent can add unresolved considerations.
- Agent mutations appear immediately in the UI.
- Provenance is correctly displayed.

---

# Stage 12 — Implement Agent Trust Rules

## Goal

Make agent contributions useful without encouraging fabricated certainty.

## Core Rule

### If the agent knows something from the current context:

It may create a Pro or Con.

Example:

User explicitly says:

```text
Parkline is $1,550/month.
```

The agent can add:

```text
+ Affordable rent
```

or a relevant con depending on context.

### If the agent only suspects something matters:

It should create a Consideration.

Example:

The agent should not invent:

```text
- Expensive parking
```

Instead:

```text
? What does parking cost?
```

## Suggested Tool Descriptions

Tool descriptions should tell the agent:

- Do not invent factual pros or cons.
- Use considerations for unknowns.
- Agent-added options should be suggestions, not assumptions.
- Respect pinned human judgments.

## Exit Criteria

- WebMCP tool descriptions encourage safe, transparent collaboration.
- Unknown information is represented as uncertainty.
- Provenance remains visible.

---

# Stage 13 — Build the Signature Human-Agent Collaboration Loop

## Goal

Make the hackathon demo clearly show why WebMCP matters.

## Ideal Demo

### Initial Human Desk

```text
WHERE SHOULD I LIVE?

WESTVIEW
+ Great neighborhood      ●●●●● 📌
- Expensive               ●●●

PARKLINE
+ Friends nearby          ●●●●● 📌
- Longer commute          ●●●

THE GROVE
+ Large bedroom           ●●
- Dark bedroom            ●●●●
```

### Agent Prompt

> Help me think through this. Add anything important I'm missing, and suggest another option if you think one is worth considering.

### Agent Actions

Agent:
- Reads current desk
- Adds one suggested option
- Adds known pros/cons where justified
- Adds unresolved questions to inbox

### Human Response

Human:
- Deletes the agent-suggested option
- Pins one thought
- Changes weight
- Resolves an inbox question
- Dismisses an irrelevant consideration

### Agent Follow-Up

> Given what I just changed, what am I really trading off now?

Agent reads the updated desk and reasons from the new state.

## Exit Criteria

Demo clearly shows:

```text
Human judgment
      ↓
Shared desk
      ↑
Agent contribution
      ↓
Human override
      ↓
Agent adapts
```

---

# Stage 14 — Visual Polish

## Goal

Make DecisionDesk feel like a finished product.

## Polish Priorities

- Refined wood background
- Sticky shadows
- Slight randomized rotation
- Pushpin visuals
- Agent provenance badges
- Smooth add/remove transitions
- Clear option headers
- Elegant typography
- Physical notepad summary
- Inbox tray feels like part of the desk

## Avoid

- Excessive texture
- Cartoonish skeuomorphism
- Strong red/green colors
- Huge animations
- Fake AI chat panel
- Complex charting

## Exit Criteria

The product looks memorable in screenshots and video.

---

# Stage 15 — Production Validation

## Goal

Verify the complete production workflow.

## Checklist

- Production build succeeds.
- Multiple desks work.
- Create desk works.
- Delete desk works.
- Dynamic options work.
- Dynamic pros/cons work.
- Weight editing works.
- Pinning works.
- Provenance works.
- Inbox works.
- Lean summary works.
- Persistence works.
- WebMCP tools register.
- Agent can read state.
- Agent can create options.
- Agent can create pros.
- Agent can create cons.
- Agent can create considerations.
- Agent changes update UI immediately.
- Human changes appear in later agent reads.
- No major console errors.
- No dead controls.

## Exit Criteria

The production URL supports the exact recorded demo workflow.

---

# Stage 16 — Deployment and Submission

## Goal

Ship the project.

## Deployment

Use the simplest already-supported deployment path.

Preferred:
- Cloudflare Pages / Workers if using the WebMCP starter

Otherwise:
- Existing lightweight deployment configuration

## Submission Assets

Prepare:

- Public live URL
- Public repository
- Open-source license
- Project description
- WebMCP explanation
- Implementation summary
- Public demo video under 3 minutes with audio

## Suggested Product Positioning

> DecisionDesk is a shared reasoning surface for people and their agents. Humans contribute the things AI cannot know for them — taste, priorities, intuition, and hard boundaries. Agents can inspect the same live desk, suggest missing considerations, add alternative options, and structure the tradeoffs without taking control away from the person making the decision.

---

# Recommended Build Order Under Time Pressure

If time is tight, implement in this order:

1. Stage 0 — Project Foundation
2. Stage 1 — Data Model
3. Stage 2 — Store and Actions
4. Stage 4 — Desk Library
5. Stage 5 — Individual Desk UI
6. Stage 6 — Sticky Interaction
7. Stage 10 — WebMCP Reads
8. Stage 11 — WebMCP Mutations
9. Stage 8 — Inbox
10. Stage 13 — Demo Loop
11. Stage 3 — Persistence
12. Stage 7 — Provenance and Pinning
13. Stage 9 — Lean Visualization
14. Stage 12 — Trust Rules
15. Stage 14 — Visual Polish
16. Stage 15 — Production Validation
17. Stage 16 — Deployment

---

# MVP Non-Negotiables

The hackathon MVP must have:

```text
multiple desks
+
dynamic options
+
dynamic pros and cons
+
weighted stickies
+
human pinning
+
agent provenance
+
agent-added options
+
agent-added pros/cons
+
agent-added inbox considerations
+
shared live state through WebMCP
+
clear human override
```

Everything beyond that is optional.

---

# Product Mental Model

The final product should remain easy to explain:

```text
DecisionDesk
     │
     ├── Desks
     │     individual decisions
     │
     ├── Options
     │     possible choices
     │
     ├── Sticky Notes
     │     pros and cons
     │
     ├── Weight Dots
     │     importance
     │
     ├── Pushpins
     │     human-protected judgment
     │
     ├── Sparkles
     │     agent contributions
     │
     └── Inbox
           unresolved considerations
```

The guiding design principle is:

> Known information becomes a sticky. Missing information becomes an inbox item. Human priorities can be pinned. Both the human and agent can contribute to the same desk.
