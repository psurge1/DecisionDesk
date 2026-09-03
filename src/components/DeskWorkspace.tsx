import { FormEvent, KeyboardEvent, useState } from "react";
import { decisionStore } from "../store";
import type { Desk } from "../types";

type DeskWorkspaceProps = {
  desk: Desk;
};

export function DeskWorkspace({ desk }: DeskWorkspaceProps) {
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [optionName, setOptionName] = useState("");
  const [optionError, setOptionError] = useState("");

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

  return (
    <section className="desk-workspace">
      <header className="workspace-header">
        <h1>{desk.title}</h1>
      </header>

      <section className="options-area" aria-label="Decision options">
        <div className="option-grid">
          {desk.options.map((option, optionIndex) => (
            <article
              className={`option-column option-column--${(optionIndex % 3) + 1}`}
              key={option.id}
            >
              <header className="option-header">
                <h2>{option.name}</h2>
                <div className="option-actions">
                  <button type="button" disabled>
                    + Pro
                  </button>
                  <button type="button" disabled>
                    − Con
                  </button>
                </div>
              </header>
              <div className="thought-stack">
                {option.thoughts.map((thought) => (
                  <div
                    className={`thought-card thought-card--${thought.type}${thought.pinned ? " thought-card--pinned" : ""}`}
                    key={thought.id}
                  >
                    <div className="thought-meta">
                      <span
                        className="thought-type"
                        aria-label={thought.type === "pro" ? "Pro" : "Con"}
                      >
                        {thought.type === "pro" ? "+" : "−"}
                      </span>
                      {thought.pinned ? (
                        <span
                          className="thought-pin"
                          role="img"
                          aria-label="Pinned human judgment"
                        />
                      ) : null}
                    </div>
                    <p>{thought.text}</p>
                    <div className="weight-dots" aria-label={`Weight ${thought.weight} out of 5`}>
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <span
                          className={dot <= thought.weight ? "weight-dot weight-dot--filled" : "weight-dot"}
                          key={dot}
                        />
                      ))}
                    </div>
                  </div>
                ))}
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

      {desk.considerations.length ? (
        <section className="open-questions" aria-label="Open considerations">
          <h2>Things I’m still thinking about</h2>
          <div className="consideration-list">
            {desk.considerations.map((consideration) => (
              <div className="consideration-item" key={consideration.id}>
                <span>{consideration.text}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
