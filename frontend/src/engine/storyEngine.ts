import type {
  Choice,
  ChoiceScene,
  ConversationOutcome,
  ConversationScene,
  Flags,
  NextRef,
  QuestionScene,
  Scene,
  Story,
  Transition,
} from "../types/story";

export interface GameState {
  currentSceneId: string;
  flags: Flags;
}

export function createInitialState(story: Story): GameState {
  return { currentSceneId: story.start, flags: {} };
}

export function getScene(story: Story, sceneId: string): Scene {
  const scene = story.scenes[sceneId];
  if (!scene) {
    throw new Error(`Ukjent scene-id: "${sceneId}"`);
  }
  return scene;
}

export function isChoiceAvailable(choice: Choice, flags: Flags): boolean {
  if (!choice.condition) return true;
  return flags[choice.condition.flag] === choice.condition.equals;
}

export function availableChoices(scene: ChoiceScene, flags: Flags): Choice[] {
  return scene.choices.filter((choice) => isChoiceAvailable(choice, flags));
}

export function pickNext(ref: NextRef, rng: () => number = Math.random): { sceneId: string; setFlags?: Flags } {
  if (typeof ref === "string") return { sceneId: ref };
  const options = ref.random;
  const total = options.reduce((sum, o) => sum + (o.weight ?? 1), 0);
  let roll = rng() * total;
  for (const option of options) {
    roll -= option.weight ?? 1;
    if (roll <= 0) return { sceneId: option.next, setFlags: option.setFlags };
  }
  const last = options[options.length - 1];
  return { sceneId: last.next, setFlags: last.setFlags };
}

export function applyTransition(state: GameState, transition: Transition, rng?: () => number): GameState {
  const { sceneId, setFlags: optionFlags } = pickNext(transition.next, rng);
  return {
    currentSceneId: sceneId,
    flags: { ...state.flags, ...transition.setFlags, ...optionFlags },
  };
}

export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isAnswerCorrect(scene: QuestionScene, rawInput: string): boolean {
  const normalized = normalizeAnswer(rawInput);
  return scene.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}

/**
 * - `correct`: took `onCorrect`.
 * - `retry`: wrong, but attempts remain (`maxAttempts`); state is unchanged.
 * - `failed`: wrong with no attempts left (or no `maxAttempts`, where every miss counts); took `onIncorrect`,
 *   which may point back at this same scene for another round.
 */
export type AnswerResult = "correct" | "retry" | "failed";

export function submitAnswer(
  state: GameState,
  scene: QuestionScene,
  rawInput: string,
  attemptsSoFar = 0,
  rng?: () => number
): { state: GameState; result: AnswerResult } {
  if (isAnswerCorrect(scene, rawInput)) {
    return { state: applyTransition(state, scene.onCorrect, rng), result: "correct" };
  }
  if (scene.maxAttempts !== undefined && attemptsSoFar + 1 < scene.maxAttempts) {
    return { state, result: "retry" };
  }
  return { state: applyTransition(state, scene.onIncorrect, rng), result: "failed" };
}

export function resolveConversationOutcome(
  state: GameState,
  scene: ConversationScene,
  outcome: ConversationOutcome,
  rng?: () => number
): GameState {
  const transition = scene.outcomeTransitions[outcome] ?? scene.outcomeTransitions.failure;
  return applyTransition(state, transition, rng);
}
