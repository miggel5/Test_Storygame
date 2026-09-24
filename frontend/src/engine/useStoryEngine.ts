import { useCallback, useEffect, useState } from "react";
import type { Choice, ConversationOutcome, ConversationScene, QuestionScene, Story } from "../types/story";
import {
  applyTransition,
  createInitialState,
  resolveConversationOutcome,
  submitAnswer,
  type GameState,
} from "./storyEngine";

const SAVE_KEY = "storygame:save";

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

function persistState(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // localStorage utilgjengelig (f.eks. privat nettlesing) - ignorer stille
  }
}

export function useStoryEngine(story: Story) {
  const [state, setState] = useState<GameState>(() => loadSavedState() ?? createInitialState(story));

  useEffect(() => {
    persistState(state);
  }, [state]);

  const choose = useCallback((choice: Choice) => {
    setState((prev) => applyTransition(prev, choice));
  }, []);

  const answerQuestion = useCallback(
    (scene: QuestionScene, rawInput: string) => {
      const { state: next, correct } = submitAnswer(state, scene, rawInput);
      setState(next);
      return correct;
    },
    [state]
  );

  const resolveConversation = useCallback((scene: ConversationScene, outcome: ConversationOutcome) => {
    setState((prev) => resolveConversationOutcome(prev, scene, outcome));
  }, []);

  const restart = useCallback(() => {
    setState(createInitialState(story));
  }, [story]);

  return { state, choose, answerQuestion, resolveConversation, restart };
}
