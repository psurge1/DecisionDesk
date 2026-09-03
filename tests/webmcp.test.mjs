import assert from "node:assert/strict";
import { before, test } from "node:test";
import { build } from "vite";

let createDecisionStore;
let demoAppState;
let createReadTools;
let createMutationTools;
let registerDecisionDeskWebMcp;

before(async () => {
  const virtualId = "virtual:webmcp-test-entry";
  const resolvedVirtualId = `\0${virtualId}`;
  const bundle = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [
      {
        name: "webmcp-test-entry",
        resolveId(id) {
          return id === virtualId ? resolvedVirtualId : null;
        },
        load(id) {
          if (id !== resolvedVirtualId) return null;
          return `
        export { createDecisionStore } from "./src/store/decisionStore.ts";
        export { demoAppState } from "./src/data/demoDesk.ts";
        export { createReadTools } from "./src/webmcp/readTools.ts";
        export { createMutationTools } from "./src/webmcp/mutationTools.ts";
        export { registerDecisionDeskWebMcp } from "./src/webmcp/register.ts";
          `;
        },
      },
    ],
    build: {
      ssr: true,
      write: false,
      rollupOptions: { input: virtualId },
    },
  });
  const source = bundle.output.find((output) => output.type === "chunk").code;
  const modules = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  ({ createDecisionStore, demoAppState, createReadTools, createMutationTools, registerDecisionDeskWebMcp } = modules);
});

test("registers all read and mutation tools with schemas", async () => {
  const registered = [];
  const context = {
    registerTool(tool, options) {
      registered.push({ tool, options });
    },
  };
  const store = createDecisionStore(demoAppState);
  const registration = await registerDecisionDeskWebMcp(context, store);

  assert.equal(registration.supported, true);
  assert.deepEqual(registration.registeredToolNames.slice(0, 7), [
    "get_desks",
    "get_current_desk",
    "get_options",
    "get_thoughts",
    "get_considerations",
    "get_tradeoffs",
    "get_lean",
  ]);
  assert.equal(registration.registeredToolNames.length, 21);
  assert.ok(registered.every(({ tool }) => tool.inputSchema.type === "object"));
  assert.ok(registered.every(({ options }) => options.signal instanceof AbortSignal));
  registration.dispose();
  assert.ok(registered.every(({ options }) => options.signal.aborted));
});

test("mutation handlers reuse the store and preserve agent provenance", async () => {
  const store = createDecisionStore(demoAppState);
  const tools = new Map(createMutationTools(store).map((tool) => [tool.name, tool]));
  const originalCurrentDeskId = store.getState().currentDeskId;

  const created = await tools.get("create_desk").execute({
    title: "Choose a laptop",
    initial_option_names: ["Framework"],
  });
  assert.equal(store.getState().currentDeskId, originalCurrentDeskId);
  assert.equal(created.desk.options[0].source, "agent");

  const deskId = created.desk.id;
  await tools.get("rename_desk").execute({ desk_id: deskId, title: "Choose my next laptop" });
  const addedOption = await tools.get("add_option").execute({ desk_id: deskId, name: "ThinkPad" });
  assert.equal(addedOption.option.source, "agent");
  const optionId = addedOption.option.id;

  const pro = await tools.get("add_pro").execute({
    desk_id: deskId,
    option_id: optionId,
    text: "Repairable design",
    weight: 4,
  });
  const con = await tools.get("add_con").execute({
    desk_id: deskId,
    option_id: optionId,
    text: "Higher initial cost",
  });
  assert.equal(pro.thought.source, "agent");
  assert.equal(con.thought.source, "agent");

  await tools.get("edit_thought").execute({
    desk_id: deskId,
    option_id: optionId,
    thought_id: pro.thought.id,
    text: "Highly repairable design",
  });
  await tools.get("set_thought_weight").execute({
    desk_id: deskId,
    option_id: optionId,
    thought_id: pro.thought.id,
    weight: 5,
  });
  await tools.get("pin_thought").execute({
    desk_id: deskId,
    option_id: optionId,
    thought_id: pro.thought.id,
  });
  const unpinned = await tools.get("unpin_thought").execute({
    desk_id: deskId,
    option_id: optionId,
    thought_id: pro.thought.id,
  });
  assert.equal(unpinned.thought.text, "Highly repairable design");
  assert.equal(unpinned.thought.weight, 5);
  assert.equal(unpinned.thought.pinned, false);

  const question = await tools.get("add_consideration").execute({
    desk_id: deskId,
    text: "How long is the warranty?",
    related_option_ids: [optionId],
  });
  assert.equal(question.consideration.source, "agent");
  await tools.get("remove_consideration").execute({
    desk_id: deskId,
    consideration_id: question.consideration.id,
  });
  await tools.get("remove_thought").execute({
    desk_id: deskId,
    option_id: optionId,
    thought_id: con.thought.id,
  });
  await tools.get("rename_option").execute({ desk_id: deskId, option_id: optionId, name: "T14" });
  await tools.get("remove_option").execute({ desk_id: deskId, option_id: optionId });

  const desk = store.getState().desks.find((candidate) => candidate.id === deskId);
  assert.equal(desk.title, "Choose my next laptop");
  assert.equal(desk.options.some((option) => option.id === optionId), false);
  assert.equal(desk.considerations.length, 0);
});

test("read handlers always observe the current shared store state", async () => {
  const store = createDecisionStore(demoAppState);
  const tools = new Map(createReadTools(store).map((tool) => [tool.name, tool]));
  const desk = store.getCurrentDesk();
  const option = desk.options[0];

  const added = store.addPro({
    deskId: desk.id,
    optionId: option.id,
    text: "Human-added live thought",
    weight: 4,
  });
  store.pinThought(desk.id, option.id, added.id);

  const current = await tools.get("get_current_desk").execute({});
  const observed = current.current_desk.options[0].thoughts.find((thought) => thought.id === added.id);
  assert.equal(observed.text, "Human-added live thought");
  assert.equal(observed.weight, 4);
  assert.equal(observed.pinned, true);
  assert.equal(observed.source, "human");

  const thoughts = await tools.get("get_thoughts").execute({ option_id: option.id });
  assert.ok(thoughts.thoughts.some((thought) => thought.id === added.id));
  assert.equal((await tools.get("get_considerations").execute({})).considerations.length, 3);
  assert.equal((await tools.get("get_options").execute({})).options.length, 3);
  assert.equal((await tools.get("get_desks").execute({})).desks.length, 1);
  assert.ok((await tools.get("get_tradeoffs").execute({})).tradeoffs.options.length > 0);
  assert.equal((await tools.get("get_lean").execute({})).lean.leadingOptionId, option.id);
});
