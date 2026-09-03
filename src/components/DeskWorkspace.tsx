import { FocusEvent, FormEvent, KeyboardEvent, useState } from "react";
import { entranceRegistry } from "../motion";
import { decisionStore } from "../store";
import type { Desk, ThoughtType } from "../types";
import { ConsiderationTray } from "./ConsiderationTray";
import { DecisionSummary } from "./DecisionSummary";
import { OptionHeader } from "./OptionHeader";
import { ThoughtCard } from "./ThoughtCard";

type DeskWorkspaceProps = {
  desk: Desk;
};

export function DeskWorkspace({ desk }: DeskWorkspaceProps) {
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [optionName, setOptionName] = useState("");
  const [optionError, setOptionError] = useState("");
  const [thoughtDraft, setThoughtDraft] = useState<{
    optionId: string;
    type: ThoughtType;
    text: string;
  } | null>(null);

  const closeOptionForm = () => {
    setIsAddingOption(false);
    setOptionName("");
    setOptionError("");
  };

  const addOption = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!optionName.trim()) {
      setOptionError("Enter an option name.");
      return;
    }

    decisionStore.addOption({ deskId: desk.id, name: optionName });
    closeOptionForm();
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeOptionForm();
    }
  };

  const saveThoughtDraft = () => {
    if (!thoughtDraft) {
      return;
    }

    if (thoughtDraft.text.trim()) {
      const input = {
        deskId: desk.id,
        optionId: thoughtDraft.optionId,
        text: thoughtDraft.text,
      };

      if (thoughtDraft.type === "pro") {
        decisionStore.addPro(input);
      } else {
        decisionStore.addCon(input);
      }
    }

    setThoughtDraft(null);
  };

  const startThoughtDraft = (optionId: string, type: ThoughtType) => {
    if (thoughtDraft?.text.trim()) {
      saveThoughtDraft();
    }

    setThoughtDraft({ optionId, type, text: "" });
  };

  const submitThoughtDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveThoughtDraft();
  };

  const handleThoughtDraftBlur = (event: FocusEvent<HTMLFormElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      saveThoughtDraft();
    }
  };

  const handleThoughtDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setThoughtDraft(null);
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      saveThoughtDraft();
    }
  };

  return (
    <section className="desk-workspace">
      <header className="workspace-header">
        <h1>{desk.title}</h1>
      </header>

      <div className="decision-layout">
        <div className="decision-content">
          <section className="options-area" aria-label="Decision options">
            <div className="option-grid">
          {desk.options.map((option, optionIndex) => (
            <article
              className={`option-column option-column--${(optionIndex % 3) + 1}${entranceRegistry.className(
                "option",
                option.id,
                option.source,
              )}`}
              key={option.id}
            >
              <OptionHeader
                deskId={desk.id}
                option={option}
                onAddThought={(type) => startThoughtDraft(option.id, type)}
              />
              <div className="thought-stack">
                {option.thoughts.map((thought) => (
                  <ThoughtCard
                    deskId={desk.id}
                    optionId={option.id}
                    thought={thought}
                    key={thought.id}
                  />
                ))}
                {thoughtDraft?.optionId === option.id ? (
                  <form
                    className={`thought-card thought-card--${thoughtDraft.type} thought-draft`}
                    onSubmit={submitThoughtDraft}
                    onBlur={handleThoughtDraftBlur}
                  >
                    <span className="thought-type" aria-hidden="true">
                      {thoughtDraft.type === "pro" ? "+" : "−"}
                    </span>
                    <textarea
                      value={thoughtDraft.text}
                      onChange={(event) =>
                        setThoughtDraft((current) =>
                          current ? { ...current, text: event.target.value } : current,
                        )
                      }
                      onKeyDown={handleThoughtDraftKeyDown}
                      placeholder={thoughtDraft.type === "pro" ? "Add a pro…" : "Add a con…"}
                      aria-label={thoughtDraft.type === "pro" ? "New pro" : "New con"}
                      rows={3}
                      autoFocus
                    />
                    <div className="thought-editor-actions">
                      <button type="submit">Add</button>
                      <button type="button" onClick={() => setThoughtDraft(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </article>
          ))}

          {isAddingOption ? (
            <form className="add-option-form" onSubmit={addOption}>
              <label htmlFor="new-option-name">New option</label>
              <input
                id="new-option-name"
                value={optionName}
                onChange={(event) => {
                  setOptionName(event.target.value);
                  setOptionError("");
                }}
                onKeyDown={handleOptionKeyDown}
                placeholder="Option name"
                autoFocus
              />
              {optionError ? <p className="form-error">{optionError}</p> : null}
              <div className="inline-actions">
                <button type="submit">Add</button>
                <button type="button" onClick={closeOptionForm}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              className="add-option-button"
              type="button"
              aria-label="Add another option"
              onClick={() => setIsAddingOption(true)}
            >
              <span className="add-option-plus" aria-hidden="true">
                +
              </span>
              <span className="add-option-label">Option</span>
            </button>
          )}
            </div>
          </section>

          <ConsiderationTray desk={desk} />
        </div>
        <DecisionSummary desk={desk} />
      </div>
    </section>
  );
}
