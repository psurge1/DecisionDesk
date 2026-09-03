import { FormEvent, useState } from "react";
import { entranceRegistry } from "../motion";
import { decisionStore } from "../store";
import type { Consideration, Desk, ThoughtType } from "../types";

function ConsiderationSlip({ desk, consideration }: { desk: Desk; consideration: Consideration }) {
  const relatedOptions = desk.options.filter((option) =>
    consideration.relatedOptionIds?.includes(option.id),
  );
  const [resolveType, setResolveType] = useState<ThoughtType | null>(null);
  const [optionId, setOptionId] = useState(relatedOptions[0]?.id ?? desk.options[0]?.id ?? "");
  const [resolvedText, setResolvedText] = useState("");

  const resolve = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resolveType || !optionId || !resolvedText.trim()) {
      return;
    }

    const input = {
      deskId: desk.id,
      considerationId: consideration.id,
      optionId,
      text: resolvedText,
    };

    if (resolveType === "pro") {
      decisionStore.resolveConsiderationAsPro(input);
    } else {
      decisionStore.resolveConsiderationAsCon(input);
    }
  };

  if (resolveType) {
    return (
      <form className="consideration-item consideration-resolver" onSubmit={resolve}>
        <label htmlFor={`resolve-option-${consideration.id}`}>
          {resolveType === "pro" ? "Resolve as pro" : "Resolve as con"}
        </label>
        <select
          id={`resolve-option-${consideration.id}`}
          value={optionId}
          onChange={(event) => setOptionId(event.target.value)}
          required
        >
          {desk.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <textarea
          value={resolvedText}
          onChange={(event) => setResolvedText(event.target.value)}
          placeholder="What did you learn?"
          aria-label="Resolved thought"
          rows={2}
          autoFocus
          required
        />
        <div className="consideration-actions consideration-actions--visible">
          <button type="submit">Add sticky</button>
          <button type="button" onClick={() => setResolveType(null)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article
      className={`consideration-item${entranceRegistry.className(
        "consideration",
        consideration.id,
        consideration.source,
      )}`}
    >
      <p>{consideration.text}</p>
      {relatedOptions.length ? (
        <span className="consideration-related">
          {relatedOptions.map((option) => option.name).join(", ")}
        </span>
      ) : null}
      {consideration.source === "agent" ? <span className="agent-mark">Agent</span> : null}
      <div className="consideration-actions">
        <button type="button" disabled={!desk.options.length} onClick={() => setResolveType("pro")}>
          Resolve +
        </button>
        <button type="button" disabled={!desk.options.length} onClick={() => setResolveType("con")}>
          Resolve −
        </button>
        <button
          type="button"
          onClick={() => decisionStore.removeConsideration(desk.id, consideration.id)}
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}

export function ConsiderationTray({ desk }: { desk: Desk }) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState("");
  const [relatedOptionIds, setRelatedOptionIds] = useState<string[]>([]);

  const addConsideration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    decisionStore.addConsideration({
      deskId: desk.id,
      text,
      relatedOptionIds: relatedOptionIds.length ? relatedOptionIds : undefined,
    });
    setText("");
    setRelatedOptionIds([]);
    setIsAdding(false);
  };

  const toggleRelatedOption = (optionId: string) => {
    setRelatedOptionIds((current) =>
      current.includes(optionId)
        ? current.filter((candidate) => candidate !== optionId)
        : [...current, optionId],
    );
  };

  if (!desk.considerations.length && !isAdding) {
    return (
      <section className="open-questions open-questions--empty" aria-label="Open considerations">
        <button className="add-consideration-button" type="button" onClick={() => setIsAdding(true)}>
          + Consideration
        </button>
      </section>
    );
  }

  return (
    <section className="open-questions" aria-label="Open considerations">
      <header className="consideration-header">
        <h2>Things I’m still thinking about</h2>
        {!isAdding ? (
          <button className="add-consideration-button" type="button" onClick={() => setIsAdding(true)}>
            + Consideration
          </button>
        ) : null}
      </header>

      {isAdding ? (
        <form className="consideration-compose" onSubmit={addConsideration}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What is still unknown?"
            aria-label="New consideration"
            autoFocus
            required
          />
          {desk.options.length ? (
            <fieldset>
              <legend>Related options</legend>
              {desk.options.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    checked={relatedOptionIds.includes(option.id)}
                    onChange={() => toggleRelatedOption(option.id)}
                  />
                  {option.name}
                </label>
              ))}
            </fieldset>
          ) : null}
          <div className="consideration-actions consideration-actions--visible">
            <button type="submit">Add question</button>
            <button type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="consideration-list">
        {desk.considerations.map((consideration) => (
          <ConsiderationSlip key={consideration.id} desk={desk} consideration={consideration} />
        ))}
      </div>
    </section>
  );
}
