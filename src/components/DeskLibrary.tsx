import { FormEvent, useState } from "react";
import { decisionStore, getDeskLean } from "../store";
import type { Desk } from "../types";

type DeskLibraryProps = {
  desks: Desk[];
  isCreating: boolean;
  onCreatingChange: (isCreating: boolean) => void;
  onOpenDesk: (deskId: string) => void;
};

function getDeskCounts(desk: Desk) {
  return {
    thoughts: desk.options.reduce((total, option) => total + option.thoughts.length, 0),
    considerations: desk.considerations.length,
  };
}

function DeskCard({ desk, onOpen }: { desk: Desk; onOpen: () => void }) {
  const [mode, setMode] = useState<"idle" | "rename" | "delete">("idle");
  const [name, setName] = useState(desk.title);
  const [renameError, setRenameError] = useState("");
  const counts = getDeskCounts(desk);
  const lean = getDeskLean(desk);

  const renameDesk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setRenameError("Enter a decision name.");
      return;
    }

    decisionStore.renameDesk(desk.id, name);
    setRenameError("");
    setMode("idle");
  };

  return (
    <article className="desk-card">
      {mode === "rename" ? (
        <form className="desk-card-rename" onSubmit={renameDesk}>
          <label htmlFor={`rename-${desk.id}`}>Rename decision</label>
          <input
            id={`rename-${desk.id}`}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setRenameError("");
            }}
            autoFocus
            required
          />
          {renameError ? <p className="form-error">{renameError}</p> : null}
          <div className="inline-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <button className="desk-card-open" type="button" onClick={onOpen}>
            <h2>{desk.title}</h2>
            <div className="desk-card-summary">
              <span>{desk.options.length} options</span>
              <span>{counts.thoughts} thoughts</span>
              <span>{counts.considerations} open</span>
            </div>
            {lean.leadingOptionName ? (
              <p className="desk-card-lean">Leaning toward {lean.leadingOptionName}</p>
            ) : null}
          </button>

          <div className="desk-card-actions">
            {mode === "delete" ? (
              <>
                <span>Delete?</span>
                <button type="button" onClick={() => decisionStore.deleteDesk(desk.id)}>
                  Yes
                </button>
                <button type="button" onClick={() => setMode("idle")}>
                  No
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setMode("rename")}>
                  Rename
                </button>
                <button type="button" onClick={() => setMode("delete")}>
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function CreateDeskForm({ onCreated, onCancel }: { onCreated: (deskId: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [optionNames, setOptionNames] = useState(["", ""]);
  const [error, setError] = useState("");

  const createDesk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Enter the decision you want to make.");
      return;
    }

    const desk = decisionStore.createDesk({
      title,
      initialOptionNames: optionNames.filter((name) => name.trim()),
    });
    onCreated(desk.id);
  };

  return (
    <form className="create-desk-sheet" onSubmit={createDesk}>
      <div className="create-desk-heading">
        <label htmlFor="decision-title">What are you deciding?</label>
        <button type="button" onClick={onCancel} aria-label="Close new desk form">
          Close
        </button>
      </div>
      <input
        id="decision-title"
        className="decision-title-input"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setError("");
        }}
        placeholder="Which laptop should I buy?"
        autoFocus
        required
      />
      {error ? <p className="form-error">{error}</p> : null}

      <fieldset>
        <legend>Initial options</legend>
        {optionNames.map((optionName, index) => (
          <input
            key={index}
            value={optionName}
            onChange={(event) =>
              setOptionNames((current) =>
                current.map((name, optionIndex) =>
                  optionIndex === index ? event.target.value : name,
                ),
              )
            }
            placeholder={`Option ${index + 1}`}
            aria-label={`Initial option ${index + 1}`}
          />
        ))}
      </fieldset>

      <div className="create-desk-actions">
        <button
          className="quiet-action"
          type="button"
          onClick={() => setOptionNames((current) => [...current, ""])}
        >
          + Add another option
        </button>
        <button className="primary-action" type="submit">
          Create desk
        </button>
      </div>
    </form>
  );
}

export function DeskLibrary({
  desks,
  isCreating,
  onCreatingChange,
  onOpenDesk,
}: DeskLibraryProps) {
  return (
    <section className="desk-library" aria-labelledby="desk-library-title">
      <header className="library-header">
        <div>
          <p className="library-kicker">Your desks</p>
          <h1 id="desk-library-title">Decisions in progress</h1>
        </div>
        <button className="reset-demo-button" type="button" onClick={() => decisionStore.resetDemo()}>
          Reset demo
        </button>
      </header>

      {isCreating ? (
        <CreateDeskForm
          onCreated={onOpenDesk}
          onCancel={() => onCreatingChange(false)}
        />
      ) : null}

      {desks.length ? (
        <div className="desk-card-grid">
          {desks.map((desk) => (
            <DeskCard key={desk.id} desk={desk} onOpen={() => onOpenDesk(desk.id)} />
          ))}
          {!isCreating ? (
            <button className="new-desk-sheet" type="button" onClick={() => onCreatingChange(true)}>
              <span aria-hidden="true">+</span>
              New decision
            </button>
          ) : null}
        </div>
      ) : (
        <div className="empty-library">
          <p>No decisions yet.</p>
          <button type="button" onClick={() => onCreatingChange(true)}>
            Create your first desk
          </button>
        </div>
      )}
    </section>
  );
}
