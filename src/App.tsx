import { demoDesk } from "./data/demoDesk";
import "./index.css";

function App() {
  return (
    <main className="app-shell">
      <aside className="desk-sidebar" aria-label="DecisionDesk navigation">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            ◈
          </span>
          <span>DecisionDesk</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Your desks</div>
          <button className="desk-list-item desk-list-item--active" type="button">
            <span>{demoDesk.title}</span>
            <span className="desk-list-count">3</span>
          </button>
          <button className="new-desk-button" type="button" disabled>
            <span aria-hidden="true">+</span> New desk
          </button>
        </div>

        <div className="sidebar-note">
          <span className="sidebar-note-icon" aria-hidden="true">
            ✦
          </span>
          <p>Make room for what you know — and what you still need to learn.</p>
        </div>
      </aside>

      <section className="desk-workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">{demoDesk.eyebrow}</p>
            <h1>{demoDesk.title}</h1>
            <p className="workspace-description">{demoDesk.description}</p>
          </div>
          <div className="header-actions">
            <span className="saved-state">Demo desk</span>
            <button className="quiet-button" type="button" disabled>
              Share
            </button>
          </div>
        </header>

        <div className="workspace-rule" />

        <section className="options-area" aria-label="Decision options">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The possibilities</p>
              <h2>Lay it all out</h2>
            </div>
            <span className="section-hint">Every choice has a little more to say.</span>
          </div>

          <div className="option-grid">
            {demoDesk.options.map((option, optionIndex) => (
              <article className={`option-column option-column--${optionIndex + 1}`} key={option.name}>
                <div className="option-header">
                  <span className="option-number">0{optionIndex + 1}</span>
                  <h3>{option.name}</h3>
                </div>
                <div className="thought-stack">
                  {option.thoughts.map((thought, thoughtIndex) => (
                    <div
                      className={`thought-card thought-card--${thought.type}`}
                      key={`${option.name}-${thought.text}`}
                      style={{ transform: `rotate(${thoughtIndex % 2 === 0 ? -1 : 1.2}deg)` }}
                    >
                      <div className="thought-meta">
                        <span className="thought-type">{thought.type === "pro" ? "+ Pro" : "− Con"}</span>
                        {thought.pinned ? <span aria-label="Pinned human judgment">📌</span> : null}
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
                <div className="option-actions">
                  <button type="button" disabled>
                    + Pro
                  </button>
                  <button type="button" disabled>
                    − Con
                  </button>
                </div>
              </article>
            ))}
            <button className="add-option-card" type="button" disabled>
              <span className="add-option-plus" aria-hidden="true">
                +
              </span>
              <span>Add another option</span>
            </button>
          </div>
        </section>

        <aside className="consideration-tray" aria-label="Open considerations">
          <div className="tray-heading">
            <span className="tray-icon" aria-hidden="true">
              ?
            </span>
            <div>
              <p className="eyebrow">Open considerations</p>
              <h2>Things to think about</h2>
            </div>
            <span className="tray-count">{demoDesk.considerations.length}</span>
          </div>
          <div className="consideration-list">
            {demoDesk.considerations.map((consideration) => (
              <div className="consideration-item" key={consideration}>
                <span className="consideration-question" aria-hidden="true">
                  ?
                </span>
                <span>{consideration}</span>
              </div>
            ))}
          </div>
          <p className="tray-footnote">Unknowns stay here until you decide what they mean.</p>
        </aside>
      </section>
    </main>
  );
}

export default App;
