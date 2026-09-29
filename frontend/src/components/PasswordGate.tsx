import { useState, type FormEvent, type ReactNode } from "react";
import { getAuthHeader, login, type LoginResult } from "../api/auth";

const MESSAGES: Record<Exclude<LoginResult, "ok">, string> = {
  invalid: "Feil passord. Prøv igjen.",
  unreachable: "Får ikke kontakt med tjeneren akkurat nå. Den kan være i ferd med å våkne - prøv igjen om et øyeblikk.",
};

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => getAuthHeader() !== null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (unlocked) return <>{children}</>;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    const result = await login(password);
    setChecking(false);
    if (result === "ok") {
      setUnlocked(true);
    } else {
      setError(MESSAGES[result]);
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
          {error && <p className="question-feedback--wrong">{error}</p>}
        </form>
      </div>
    </main>
  );
}
