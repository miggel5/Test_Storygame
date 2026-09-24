import { useCallback, useEffect, useState } from "react";
import type { Choice, Story } from "../types/story";
import { applyChoice, createInitialState, type GameState } from "./storyEngine";

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
    setState((prev) => applyChoice(prev, choice));
  }, []);

  const restart = useCallback(() => {
    const fresh = createInitialState(story);
    setState(fresh);
  }, [story]);

  return { state, choose, restart };
}
