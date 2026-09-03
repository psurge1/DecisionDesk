import { FocusEvent, FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { decisionStore } from "../store";
import type { Thought, ThoughtWeight } from "../types";

type ThoughtCardProps = {
  deskId: string;
  optionId: string;
  thought: Thought;
};

export function ThoughtCard({ deskId, optionId, thought }: ThoughtCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(thought.text);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setText(thought.text);
    }
  }, [isEditing, thought.text]);

  const closeEditor = () => {
    setText(thought.text);
    setEditError("");
    setIsEditing(false);
  };

  const saveEdit = () => {
    if (!text.trim()) {
      setEditError("A thought needs some text.");
      return;
    }

    if (text.trim() !== thought.text) {
      decisionStore.editThought(deskId, optionId, thought.id, text);
    }

    setEditError("");
    setIsEditing(false);
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveEdit();
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEditor();
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      saveEdit();
    }
  };

  const handleEditorBlur = (event: FocusEvent<HTMLFormElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      saveEdit();
    }
  };

  const setWeight = (weight: ThoughtWeight) => {
    decisionStore.setThoughtWeight(deskId, optionId, thought.id, weight);
  };

  return (
    <article
      className={`thought-card thought-card--${thought.type}${thought.pinned ? " thought-card--pinned" : ""}`}
    >
      <div className="thought-meta">
        <span className="thought-type" aria-label={thought.type === "pro" ? "Pro" : "Con"}>
          {thought.type === "pro" ? "+" : "−"}
        </span>
        <div className="thought-origin">
          {thought.source === "agent" ? <span className="agent-mark thought-source">Agent</span> : null}
          <button
            className={`pin-button${thought.pinned ? " pin-button--active" : ""}`}
            type="button"
            aria-label={thought.pinned ? "Unpin thought" : "Pin thought"}
            aria-pressed={thought.pinned}
            onClick={() =>
              thought.pinned
                ? decisionStore.unpinThought(deskId, optionId, thought.id)
                : decisionStore.pinThought(deskId, optionId, thought.id)
            }
          >
            <span className="thought-pin" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <form className="thought-editor" onSubmit={submitEdit} onBlur={handleEditorBlur}>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setEditError("");
            }}
            onKeyDown={handleEditKeyDown}
            aria-label="Edit thought"
            autoFocus
            rows={3}
          />
          {editError ? <p className="form-error">{editError}</p> : null}
          <div className="thought-editor-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={closeEditor}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="thought-text-button" type="button" onClick={() => setIsEditing(true)}>
          {thought.text}
        </button>
      )}

      <footer className="thought-footer">
        <div className="weight-dots" role="group" aria-label={`Weight ${thought.weight} out of 5`}>
          {[1, 2, 3, 4, 5].map((weight) => (
            <button
              className={weight <= thought.weight ? "weight-dot weight-dot--filled" : "weight-dot"}
              type="button"
              key={weight}
              aria-label={`Set weight to ${weight}`}
              aria-pressed={weight === thought.weight}
              onClick={() => setWeight(weight as ThoughtWeight)}
            />
          ))}
        </div>
        <div className="thought-actions">
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button
            type="button"
            onClick={() => decisionStore.flipThoughtType(deskId, optionId, thought.id)}
          >
            Make {thought.type === "pro" ? "con" : "pro"}
          </button>
          <button
            type="button"
            onClick={() => decisionStore.removeThought(deskId, optionId, thought.id)}
          >
            Delete
          </button>
        </div>
      </footer>
    </article>
  );
}
