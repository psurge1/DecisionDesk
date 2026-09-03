import { demoDesk } from "./data/demoDesk";
import "./index.css";

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">DecisionDesk</div>
        <nav className="desk-navigation" aria-label="DecisionDesk navigation">
          <button className="desk-switcher" type="button" aria-label={`Switch desk. Current desk: ${demoDesk.title}`}>
            Desks
          </button>
          <button className="new-desk-button" type="button" disabled>
            <span aria-hidden="true">+</span> New desk
          </button>
        </nav>
      </header>

      <section className="desk-workspace">
        <header className="workspace-header">
          <h1>{demoDesk.title}</h1>
        </header>

        <section className="options-area" aria-label="Decision options">
          <div className="option-grid">
            {demoDesk.options.map((option, optionIndex) => (
              <article className={`option-column option-column--${optionIndex + 1}`} key={option.name}>
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
                      key={`${option.name}-${thought.text}`}
                    >
                      <div className="thought-meta">
                        <span className="thought-type" aria-label={thought.type === "pro" ? "Pro" : "Con"}>
                          {thought.type === "pro" ? "+" : "−"}
                        </span>
                        {thought.pinned ? (
                          <span className="thought-pin" role="img" aria-label="Pinned human judgment" />
                        ) : null}
                      </div>
                      <p>{thought.text}</p>
                      <div className="weight-dots" aria-label={`Weight ${thought.weight} out of 5`}>
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <span className={dot <= thought.weight ? "weight-dot weight-dot--filled" : "weight-dot"} key={dot} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
            <button className="add-option-button" type="button" aria-label="Add another option" disabled>
              <span className="add-option-plus" aria-hidden="true">
                +
              </span>
              <span className="add-option-label">Option</span>
            </button>
          </div>
        </section>

        <section className="open-questions" aria-label="Open considerations">
          <h2>Things I’m still thinking about</h2>
          <div className="consideration-list">
            {demoDesk.considerations.map((consideration) => (
              <div className="consideration-item" key={consideration}>
                <span>{consideration}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
