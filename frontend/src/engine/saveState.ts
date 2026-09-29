import type { Story } from "../types/story";
import type { GameState } from "./storyEngine";

const SAVE_KEY = "storygame:save";

/** A saved state is only usable if it still points at a scene that exists in this version of the story. */
function isUsableState(value: unknown, story: Story): value is GameState {
  if (typeof value !== "object" || value === null) return false;
  const { currentSceneId, flags } = value as Record<string, unknown>;
  return (
    typeof currentSceneId === "string" &&
    Object.hasOwn(story.scenes, currentSceneId) &&
    typeof flags === "object" &&
    flags !== null &&
    !Array.isArray(flags)
  );
}

export function loadSavedState(story: Story): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isUsableState(parsed, story) ? parsed : null;
  } catch {
    return null;
  }
}

export function persistState(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // localStorage utilgjengelig (f.eks. privat nettlesing) - ignorer stille
  }
}

export function clearSavedState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignorer
  }
}
