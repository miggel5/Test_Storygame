import { readFileSync } from "node:fs";
import { CONVERSATIONS_OUT, STORY_OUT, loadSource, renderOutputs, writeOutputs } from "./storyBuild.ts";

const source = loadSource();

if (process.argv.includes("--check")) {
  const { storyJson, conversationsJson } = renderOutputs(source);
  const stale = [
    [STORY_OUT, storyJson],
    [CONVERSATIONS_OUT, conversationsJson],
  ].filter(([path, expected]) => {
    try {
      // git may check files out with CRLF on Windows; the content is what matters.
      return readFileSync(path, "utf-8").replace(/\r\n/g, "\n") !== expected;
    } catch {
      return true;
    }
  });
  if (stale.length > 0) {
    console.error(`Genererte filer er ikke oppdatert (kjør "npm run build-story"):\n${stale.map(([p]) => `  ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log("Genererte filer er oppdatert.");
} else {
  writeOutputs(source);
  console.log(`Bygde ${Object.keys(source.scenes).length} scener -> ${STORY_OUT}\nog samtale-prompts -> ${CONVERSATIONS_OUT}`);
}
