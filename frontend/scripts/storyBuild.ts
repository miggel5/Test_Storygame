/**
 * Shared loader/builder for the story sources in `content/`.
 *
 *   content/meta.json            title + start scene
 *   content/scenes/<track>.json  scenes of one track, pretty-printed (readable diffs)
 *   content/art/<track>.json     pixel art for the same track, one scene per line (RLE-encoded)
 *
 * `npm run build-story` turns these into the two generated files the apps read:
 *   frontend/src/story/story.generated.json   scenes + art, no LLM prompts
 *   backend/app/conversations.json            LLM prompts, keyed by scene id
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ConversationScene, PixelArtSpec, Scene, Story } from "../src/types/story.ts";

export const CONTENT_DIR = fileURLToPath(new URL("../../content/", import.meta.url));
export const STORY_OUT = fileURLToPath(new URL("../src/story/story.generated.json", import.meta.url));
export const CONVERSATIONS_OUT = fileURLToPath(new URL("../../backend/app/conversations.json", import.meta.url));

/** Scene ids that don't belong to a track by prefix (the opening) live in this file. */
export const INTRO_TRACK = "intro";

/** Track membership by scene-id prefix; order matters (first match wins). */
export const TRACK_PREFIXES: [string, string[]][] = [
  ["hell", ["fork1", "hel_", "heir_"]],
  ["forest", ["fork2", "for_"]],
  ["pilot", ["fork3_pilot", "pil_"]],
  ["villain", ["fork3_villain", "vil_"]],
];

export function trackOf(id: string): string {
  for (const [track, prefixes] of TRACK_PREFIXES) {
    if (prefixes.some((p) => id.startsWith(p))) return track;
  }
  return INTRO_TRACK;
}

/** A conversation scene as authored: the persona prompt is part of the scene. */
export type SourceConversationScene = ConversationScene & { systemPrompt: string };
export type SourceScene = Exclude<Scene, ConversationScene> | SourceConversationScene;

export interface SourceStory {
  title: string;
  start: string;
  scenes: Record<string, SourceScene>;
}

export interface ConversationConfig {
  character_name: string;
  system_prompt: string;
  max_turns?: number;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function loadSource(): SourceStory {
  const meta = readJson<{ title: string; start: string }>(`${CONTENT_DIR}meta.json`);
  const scenes: Record<string, SourceScene> = {};
  for (const file of readdirSync(`${CONTENT_DIR}scenes`).sort()) {
    if (!file.endsWith(".json")) continue;
    const track = file.replace(/\.json$/, "");
    const trackScenes = readJson<Record<string, SourceScene>>(`${CONTENT_DIR}scenes/${file}`);
    const artPath = `${CONTENT_DIR}art/${file}`;
    const art = existsSync(artPath) ? readJson<Record<string, PixelArtSpec>>(artPath) : {};
    for (const [id, scene] of Object.entries(trackScenes)) {
      if (id in scenes) throw new Error(`Duplicate scene id "${id}" (again in ${file}).`);
      if (trackOf(id) !== track) throw new Error(`Scene "${id}" is in ${file} but belongs to track "${trackOf(id)}".`);
      scenes[id] = id in art ? { ...scene, image: art[id] } : scene;
    }
    for (const id of Object.keys(art)) {
      if (!(id in trackScenes)) throw new Error(`content/art/${file} has art for unknown scene "${id}".`);
    }
  }
  return { ...meta, scenes };
}

/** Splits an authored story into the public runtime story and the server-side conversation prompts. */
export function buildRuntime(source: SourceStory): { story: Story; conversations: Record<string, ConversationConfig> } {
  const scenes: Record<string, Scene> = {};
  const conversations: Record<string, ConversationConfig> = {};
  for (const [id, scene] of Object.entries(source.scenes)) {
    if (scene.interaction === "conversation") {
      const { systemPrompt, ...publicScene } = scene as SourceConversationScene;
      scenes[id] = publicScene;
      conversations[id] = {
        character_name: scene.characterName,
        system_prompt: systemPrompt,
        ...(scene.maxTurns !== undefined ? { max_turns: scene.maxTurns } : {}),
      };
    } else {
      scenes[id] = scene;
    }
  }
  return { story: { title: source.title, start: source.start, scenes }, conversations };
}

/** The exact bytes written to the generated files (also used by `--check`). */
export function renderOutputs(source: SourceStory): { storyJson: string; conversationsJson: string } {
  const { story, conversations } = buildRuntime(source);
  return {
    storyJson: JSON.stringify(story),
    conversationsJson: `${JSON.stringify(conversations, null, 2)}\n`,
  };
}

export function writeOutputs(source: SourceStory): void {
  const { storyJson, conversationsJson } = renderOutputs(source);
  writeFileSync(STORY_OUT, storyJson, "utf-8");
  writeFileSync(CONVERSATIONS_OUT, conversationsJson, "utf-8");
}

/** Serialisation of the source files, shared by the splitter and any future authoring tools. */
export function serializeScenes(scenes: Record<string, unknown>): string {
  return `${JSON.stringify(scenes, null, 2)}\n`;
}

export function serializeArt(art: Record<string, PixelArtSpec>): string {
  const lines = Object.entries(art).map(([id, spec]) => `  ${JSON.stringify(id)}: ${JSON.stringify(spec)}`);
  return `{\n${lines.join(",\n")}\n}\n`;
}
