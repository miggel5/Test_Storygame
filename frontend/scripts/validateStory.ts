import { readFileSync } from "node:fs";
import type { ConversationScene, NextRef, QuestionScene, Scene, Story } from "../src/types/story.ts";

const path = process.argv[2];
if (!path) {
  console.error("Bruk: node scripts/validateStory.ts <sti-til-story.json>");
  process.exit(1);
}

const story = JSON.parse(readFileSync(path, "utf-8")) as Story;
const errors: string[] = [];
const warnings: string[] = [];

function collectNextTargets(ref: NextRef): string[] {
  return typeof ref === "string" ? [ref] : ref.random.map((o) => o.next);
}

function outgoingTargets(scene: Scene): string[] {
  switch (scene.interaction) {
    case "choice":
      return scene.choices.flatMap((c) => collectNextTargets(c.next));
    case "question":
      return [...collectNextTargets(scene.onCorrect.next), ...collectNextTargets(scene.onIncorrect.next)];
    case "conversation": {
      const t = scene.outcomeTransitions;
      return [
        ...collectNextTargets(t.success.next),
        ...collectNextTargets(t.failure.next),
        ...(t.twist ? collectNextTargets(t.twist.next) : []),
      ];
    }
    case "ending":
      return [];
  }
}

if (!story.scenes[story.start]) {
  errors.push(`story.start ("${story.start}") peker ikke på en eksisterende scene.`);
}

for (const [sceneId, scene] of Object.entries(story.scenes)) {
  for (const target of outgoingTargets(scene)) {
    if (!story.scenes[target]) {
      errors.push(`Scene "${sceneId}" refererer til ukjent scene "${target}".`);
    }
  }
  if (scene.interaction === "question") {
    const q = scene as QuestionScene;
    if (q.acceptedAnswers.length === 0) {
      warnings.push(`Scene "${sceneId}" (question) har ingen acceptedAnswers.`);
    }
  }
  if (scene.interaction === "conversation") {
    const c = scene as ConversationScene;
    if (!c.systemPrompt.trim()) {
      warnings.push(`Scene "${sceneId}" (conversation) mangler systemPrompt.`);
    }
  }
}

const reachable = new Set<string>();
const queue = story.scenes[story.start] ? [story.start] : [];
while (queue.length > 0) {
  const id = queue.pop() as string;
  if (reachable.has(id)) continue;
  reachable.add(id);
  const scene = story.scenes[id];
  if (!scene) continue;
  for (const target of outgoingTargets(scene)) {
    if (!reachable.has(target)) queue.push(target);
  }
}

const unreachable = Object.keys(story.scenes).filter((id) => !reachable.has(id));
if (unreachable.length > 0) {
  warnings.push(`Uoppnåelige scener (ikke nåbare fra "${story.start}"): ${unreachable.join(", ")}`);
}

const endingCategories = new Set(
  Object.values(story.scenes)
    .filter((s): s is Scene & { interaction: "ending" } => s.interaction === "ending")
    .map((s) => s.endingCategory)
);
console.log(`Slutt-kategorier som finnes i historien: ${[...endingCategories].join(", ") || "(ingen)"}`);

for (const w of warnings) console.warn(`Advarsel: ${w}`);
for (const e of errors) console.error(`Feil: ${e}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} feil funnet.`);
  process.exit(1);
}
console.log(`\nOK - ${Object.keys(story.scenes).length} scener, ${warnings.length} advarsel(er).`);
