import { FormEvent, useState } from "react";
import { decisionStore } from "../store";
import type { Option, ThoughtType } from "../types";

type OptionHeaderProps = {
  deskId: string;
  option: Option;
  onAddThought: (type: ThoughtType) => void;
};

export function OptionHeader({ deskId, option, onAddThought }: OptionHeaderProps) {
  const [mode, setMode] = useState<"idle" | "rename" | "remove">("idle");
  const [name, setName] = useState(option.name);

  const rename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    decisionStore.renameOption(deskId, option.id, name);
    setMode("idle");
  };

  if (mode === "rename") {
    return (
      <header className="option-header option-header--editing">
        <form className="option-name-editor" onSubmit={rename}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label={`Rename ${option.name}`}
            autoFocus
            required
          />
          <div className="inline-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </form>
      </header>
    );
  }

  return (
    <header className="option-header">
      <div className="option-heading">
        <h2>{option.name}</h2>
        {option.source === "agent" ? <span className="agent-mark">Agent suggested</span> : null}
      </div>
      <div className="option-actions">
        {mode === "remove" ? (
          <>
            <span>Remove?</span>
            <button type="button" onClick={() => decisionStore.removeOption(deskId, option.id)}>
              Yes
            </button>
            <button type="button" onClick={() => setMode("idle")}>
              No
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => onAddThought("pro")}>
              + Pro
            </button>
            <button type="button" onClick={() => onAddThought("con")}>
              − Con
            </button>
            <button type="button" onClick={() => setMode("rename")}>
              Rename
            </button>
            <button type="button" onClick={() => setMode("remove")}>
              Remove
            </button>
          </>
        )}
      </div>
    </header>
  );
}
