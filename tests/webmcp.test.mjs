import assert from "node:assert/strict";
import { before, test } from "node:test";
import { build } from "vite";

let createDecisionStore;
let demoAppState;
let createReadTools;
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
  ({ createDecisionStore, demoAppState, createReadTools, registerDecisionDeskWebMcp } = modules);
});

test("registers all Stage 10 read tools with schemas", async () => {
  const registered = [];
  const context = {
    registerTool(tool, options) {
      registered.push({ tool, options });
    },
  };
  const store = createDecisionStore(demoAppState);
  const registration = await registerDecisionDeskWebMcp(context, store);

  assert.equal(registration.supported, true);
  assert.deepEqual(registration.registeredToolNames, [
    "get_desks",
    "get_current_desk",
    "get_options",
    "get_thoughts",
    "get_considerations",
    "get_tradeoffs",
    "get_lean",
  ]);
  assert.ok(registered.every(({ tool }) => tool.inputSchema.type === "object"));
  assert.ok(registered.every(({ options }) => options.signal instanceof AbortSignal));
  registration.dispose();
  assert.ok(registered.every(({ options }) => options.signal.aborted));
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
