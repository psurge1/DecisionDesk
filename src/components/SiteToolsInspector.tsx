import { useEffect, useMemo, useRef } from "react";
import { createDecisionDeskTools } from "../webmcp";
import type { WebMcpTool } from "../webmcp";

type SiteToolsInspectorProps = {
  onClose: () => void;
};

function hasInputParameters(tool: WebMcpTool): boolean {
  return Object.keys(tool.inputSchema.properties ?? {}).length > 0;
}

function ToolRow({ tool }: { tool: WebMcpTool }) {
  return (
    <article className="site-tool-row">
      <h4>{tool.name}</h4>
      <p>{tool.description}</p>
      {hasInputParameters(tool) ? (
        <details>
          <summary>View input schema</summary>
          <pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
        </details>
      ) : (
        <span className="site-tool-empty-schema">No input parameters</span>
      )}
    </article>
  );
}

export function SiteToolsInspector({ onClose }: SiteToolsInspectorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tools = useMemo(() => createDecisionDeskTools(), []);
  const readTools = tools.filter((tool) => tool.annotations?.readOnlyHint);
  const writeTools = tools.filter((tool) => !tool.annotations?.readOnlyHint);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
  }, []);

  const closeDialog = () => onClose();

  return (
    <dialog
      className="site-tools-dialog"
      ref={dialogRef}
      aria-labelledby="site-tools-title"
      aria-describedby="site-tools-description"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="site-tools-sheet">
        <header className="site-tools-header">
          <div>
            <p className="site-tools-kicker">WebMCP</p>
            <h2 id="site-tools-title">Site tools</h2>
            <p className="site-tools-count">{tools.length} tools exposed by DecisionDesk</p>
          </div>
          <button type="button" onClick={closeDialog} autoFocus>
            Close
          </button>
        </header>

        <p className="site-tools-description" id="site-tools-description">
          DecisionDesk exposes these semantic actions to compatible AI agents through WebMCP.
        </p>

        <div className="site-tool-groups">
          <section aria-labelledby="read-tools-title">
            <h3 id="read-tools-title">Read</h3>
            {readTools.map((tool) => (
              <ToolRow tool={tool} key={tool.name} />
            ))}
          </section>

          <section aria-labelledby="write-tools-title">
            <h3 id="write-tools-title">Write</h3>
            {writeTools.map((tool) => (
              <ToolRow tool={tool} key={tool.name} />
            ))}
          </section>
        </div>
      </div>
    </dialog>
  );
}
