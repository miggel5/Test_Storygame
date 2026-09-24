import type { Choice, Flags, Scene, Story } from "../types/story";

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

export function availableChoices(scene: Scene, flags: Flags): Choice[] {
  return (scene.choices ?? []).filter((choice) => isChoiceAvailable(choice, flags));
}

export function applyChoice(state: GameState, choice: Choice): GameState {
  return {
    currentSceneId: choice.next,
    flags: { ...state.flags, ...choice.setFlags },
  };
}
