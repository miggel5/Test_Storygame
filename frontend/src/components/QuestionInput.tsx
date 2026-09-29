import { useState } from "react";
import type { AnswerResult } from "../engine/storyEngine";
import type { QuestionScene } from "../types/story";

interface QuestionInputProps {
  scene: QuestionScene;
  /** `attemptsSoFar` is the number of wrong answers already given in the current round. */
  onSubmit: (rawInput: string, attemptsSoFar: number) => AnswerResult;
}

export function QuestionInput({ scene, onSubmit }: QuestionInputProps) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [wasWrong, setWasWrong] = useState(false);

  const attemptsLeft = scene.maxAttempts !== undefined ? scene.maxAttempts - attempts : undefined;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    const result = onSubmit(value, attempts);
    if (result === "correct") return;
    // "retry": another guess counts against the limit. "failed": the story moved on, or looped back to
    // this same scene for a fresh round - either way the counter starts over.
    setAttempts(result === "retry" ? (n) => n + 1 : 0);
    setWasWrong(true);
    setValue("");
  }

  return (
    <form className="question-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setWasWrong(false);
        }}
        placeholder="Skriv svaret ditt..."
        autoFocus
      />
      <button type="submit" disabled={!value.trim()}>
        Svar
      </button>
      {wasWrong && <p className="question-feedback question-feedback--wrong">Feil, prøv igjen.</p>}
      {attemptsLeft !== undefined && (
        <p className="question-attempts">{Math.max(attemptsLeft, 0)} forsøk igjen</p>
      )}
    </form>
  );
}
