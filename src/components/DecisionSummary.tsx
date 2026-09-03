import { getTradeoffSummary } from "../store";
import type { Desk, Thought } from "../types";

function strongestThought(thoughts: Thought[]): Thought | null {
  return thoughts.reduce<Thought | null>(
    (strongest, thought) => (!strongest || thought.weight > strongest.weight ? thought : strongest),
    null,
  );
}

export function DecisionSummary({ desk }: { desk: Desk }) {
  const summary = getTradeoffSummary(desk);
  const relevantOptions = summary.lean.leadingOptionId
    ? summary.options.filter((option) => option.optionId === summary.lean.leadingOptionId)
    : summary.options.filter((option) => summary.lean.tiedOptionIds.includes(option.optionId));
  const strongestPros = relevantOptions
    .flatMap((option) => option.strongestPros)
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 2);
  const biggestSacrifice = strongestThought(
    relevantOptions.flatMap((option) => option.strongestCons),
  );
  const leanLabel = summary.lean.leadingOptionName
    ? summary.lean.leadingOptionName
    : relevantOptions.length
      ? relevantOptions.map((option) => option.optionName).join(" / ")
      : "No options yet";

  return (
    <aside className="decision-summary" aria-label="Decision summary">
      <p className="summary-kicker">Your decision</p>
      <div className="summary-lean">
        <span>{summary.lean.leadingOptionName ? "Currently leaning" : "Closest contenders"}</span>
        <strong>{leanLabel}</strong>
        {summary.lean.score !== null ? <small>Direction {summary.lean.score >= 0 ? "+" : ""}{summary.lean.score}</small> : null}
      </div>

      {strongestPros.length ? (
        <section>
          <h2>Strongest reasons</h2>
          <ul>
            {strongestPros.map((thought) => (
              <li key={thought.id}>{thought.text}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {biggestSacrifice ? (
        <section>
          <h2>Biggest sacrifice</h2>
          <p>{biggestSacrifice.text}</p>
        </section>
      ) : null}

      <p className="summary-open-count">
        {summary.openConsiderationCount} open consideration{summary.openConsiderationCount === 1 ? "" : "s"}
      </p>
    </aside>
  );
}
