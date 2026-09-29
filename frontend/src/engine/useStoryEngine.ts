import { useCallback, useEffect, useState } from "react";
import type { Choice, ConversationOutcome, ConversationScene, QuestionScene, Story } from "../types/story";
import { loadSavedState, persistState } from "./saveState";
import {
  applyTransition,
  createInitialState,
  resolveConversationOutcome,
  submitAnswer,
  type AnswerResult,
  type GameState,
} from "./storyEngine";

/**
 * One random roll per player action, taken outside the state updater: updaters must be pure
 * (React may run them twice), so the roll is fixed up front and reused if that happens.
 */
function fixedRoll(): () => number {
  const roll = Math.random();
  return () => roll;
}

export function useStoryEngine(story: Story) {
  const [state, setState] = useState<GameState>(() => loadSavedState(story) ?? createInitialState(story));

  useEffect(() => {
    persistState(state);
  }, [state]);

  const choose = useCallback((choice: Choice) => {
    const rng = fixedRoll();
    setState((prev) => applyTransition(prev, choice, rng));
  }, []);

  const answerQuestion = useCallback(
    (scene: QuestionScene, rawInput: string, attemptsSoFar: number): AnswerResult => {
      const { state: next, result } = submitAnswer(state, scene, rawInput, attemptsSoFar, fixedRoll());
      if (result !== "retry") setState(next);
      return result;
    },
    [state]
  );

  const resolveConversation = useCallback((scene: ConversationScene, outcome: ConversationOutcome) => {
    const rng = fixedRoll();
    setState((prev) => resolveConversationOutcome(prev, scene, outcome, rng));
  }, []);

  const restart = useCallback(() => {
    setState(createInitialState(story));
  }, [story]);

  return { state, choose, answerQuestion, resolveConversation, restart };
}
