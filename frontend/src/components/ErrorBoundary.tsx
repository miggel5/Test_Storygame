import { Component, type ErrorInfo, type ReactNode } from "react";
import { clearSavedState } from "../engine/saveState";

interface ErrorBoundaryState {
  failed: boolean;
}

/** Last line of defence: a render crash offers a fresh start instead of a permanent white screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uventet feil i spillet:", error, info.componentStack);
  }

  private restart = () => {
    clearSavedState();
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="game">
        <div className="dialogue-box">
          <p>Noe gikk galt i fortellingen. Du kan starte på nytt fra begynnelsen.</p>
        </div>
        <div className="ending">
          <button type="button" onClick={this.restart}>
            Start på nytt
          </button>
        </div>
      </main>
    );
  }
}
