import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerDecisionDeskWebMcp } from "./webmcp";

void registerDecisionDeskWebMcp();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
