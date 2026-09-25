import { readFileSync, writeFileSync } from "node:fs";
import type { Scene, Story } from "../src/types/story.ts";

/**
 * A branch extension: a set of former `ending` scenes that get repurposed into
 * `choice`/`conversation` scenes (keeping their original text/image untouched),
 * plus the brand-new scenes those lead into.
 */
export interface ExtensionPatch {
  /** sceneId -> the new fields to merge onto the existing (ending) scene, replacing `interaction`/`endingCategory`. */
  convertEndings: Record<string, Omit<Scene, "text" | "image">>;
  /** sceneId -> full new scene. Must not already exist in the story. */
  newScenes: Record<string, Scene>;
}

export function applyExtension(storyPath: string, patch: ExtensionPatch): void {
  const story = JSON.parse(readFileSync(storyPath, "utf-8")) as Story;

  for (const [id, replacement] of Object.entries(patch.convertEndings)) {
    const existing = story.scenes[id];
    if (!existing) throw new Error(`convertEndings: scene "${id}" finnes ikke.`);
    if (existing.interaction !== "ending") {
      throw new Error(`convertEndings: scene "${id}" er ikke en ending (er "${existing.interaction}") - avbryter for sikkerhets skyld.`);
    }
    const { text, image } = existing;
    story.scenes[id] = { text, image, ...replacement } as Scene;
  }

  for (const [id, scene] of Object.entries(patch.newScenes)) {
    if (story.scenes[id]) throw new Error(`newScenes: scene "${id}" finnes allerede - id-kollisjon.`);
    story.scenes[id] = scene;
  }

  writeFileSync(storyPath, JSON.stringify(story), "utf-8");
  console.log(
    `Anvendte utvidelse: ${Object.keys(patch.convertEndings).length} avslutninger bygget videre på, ${
      Object.keys(patch.newScenes).length
    } nye scener lagt til. Totalt ${Object.keys(story.scenes).length} scener.`
  );
}
