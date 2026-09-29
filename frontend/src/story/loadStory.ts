import type { Story } from "../types/story";

/**
 * The story is generated from `content/` by `npm run build-story`. It is imported dynamically so the
 * ~1.4 MB of scenes and art load as a separate chunk instead of blocking the app shell.
 */
export async function loadStory(): Promise<Story> {
  const module = await import("./story.generated.json");
  return module.default as unknown as Story;
}
