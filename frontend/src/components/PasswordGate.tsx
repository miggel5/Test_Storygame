import { useState, type FormEvent, type ReactNode } from "react";
import { getAuthHeader, login } from "../api/auth";

const USERNAME = "spiller";

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => getAuthHeader() !== null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  if (unlocked) return <>{children}</>;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(false);
    const ok = await login(USERNAME, password);
    setChecking(false);
    if (ok) {
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  return (
    <main className="game">
      <h1>Skikkelsen ved bålet</h1>
      <div className="dialogue-box">
        <form className="password-gate" onSubmit={handleSubmit}>
          <p>Dette er et privat eventyr. Skriv inn passordet for å slippe inn.</p>
          <div className="question-input">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passord"
            />
            <button type="submit" disabled={checking || password.length === 0}>
              {checking ? "Sjekker..." : "Lås opp"}
            </button>
          </div>
          {error && <p className="question-feedback--wrong">Feil passord. Prøv igjen.</p>}
        </form>
      </div>
    </main>
  );
}
