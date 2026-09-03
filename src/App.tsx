import { useState } from "react";
import { DeskLibrary } from "./components/DeskLibrary";
import { DeskWorkspace } from "./components/DeskWorkspace";
import { decisionStore, useDecisionState } from "./store";
import "./index.css";

function App() {
  const state = useDecisionState();
  const [screen, setScreen] = useState<"library" | "desk">("library");
  const [isCreatingDesk, setIsCreatingDesk] = useState(false);
  const currentDesk = state.desks.find((desk) => desk.id === state.currentDeskId) ?? null;

  const showLibrary = () => {
    setScreen("library");
    setIsCreatingDesk(false);
  };

  const startNewDesk = () => {
    setScreen("library");
    setIsCreatingDesk(true);
  };

  const openDesk = (deskId: string) => {
    decisionStore.openDesk(deskId);
    setIsCreatingDesk(false);
    setScreen("desk");
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <button className="brand-lockup" type="button" onClick={showLibrary}>
          DecisionDesk
        </button>
        <nav className="desk-navigation" aria-label="DecisionDesk navigation">
          <button className="desk-switcher" type="button" onClick={showLibrary}>
            Desks
          </button>
          <button className="new-desk-button" type="button" onClick={startNewDesk}>
            <span aria-hidden="true">+</span> New desk
          </button>
        </nav>
      </header>

      {screen === "library" || !currentDesk ? (
        <DeskLibrary
          desks={state.desks}
          isCreating={isCreatingDesk}
          onCreatingChange={setIsCreatingDesk}
          onOpenDesk={openDesk}
        />
      ) : (
        <DeskWorkspace desk={currentDesk} />
      )}
    </main>
  );
}

export default App;
