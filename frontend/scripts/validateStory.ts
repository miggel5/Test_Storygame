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

// --- Gren-statistikk: dybde, forgrening og oppgavetype per spor ---
// Sporet identifiseres på scene-id-prefiks. Legg til flere prefikser her
// etter hvert som nye spor/undergrener får egne navnerom.
const TRACK_PREFIXES: [string, string[]][] = [
  ["hell", ["fork1", "hel_", "heir_"]],
  ["forest", ["fork2", "for_"]],
  ["pilot", ["fork3_pilot", "pil_"]],
  ["villain", ["fork3_villain", "vil_"]],
];

function trackOf(id: string): string {
  if (id === story.start) return "root";
  for (const [track, prefixes] of TRACK_PREFIXES) {
    if (prefixes.some((p) => id.startsWith(p))) return track;
  }
  return "other";
}

const depthFromStart: Record<string, number> = story.scenes[story.start] ? { [story.start]: 0 } : {};
{
  const q = story.scenes[story.start] ? [story.start] : [];
  while (q.length > 0) {
    const id = q.shift() as string;
    const scene = story.scenes[id];
    if (!scene) continue;
    for (const target of outgoingTargets(scene)) {
      if (!(target in depthFromStart)) {
        depthFromStart[target] = depthFromStart[id] + 1;
        q.push(target);
      }
    }
  }
}

type TrackStats = {
  scenes: number;
  choice: number;
  question: number;
  conversation: number;
  ending: number;
  endingDepths: number[];
  outDegrees: number[];
};

const stats: Record<string, TrackStats> = {};
for (const [id, scene] of Object.entries(story.scenes)) {
  const track = trackOf(id);
  const s = (stats[track] ??= { scenes: 0, choice: 0, question: 0, conversation: 0, ending: 0, endingDepths: [], outDegrees: [] });
  s.scenes++;
  s[scene.interaction]++;
  if (scene.interaction === "ending") {
    s.endingDepths.push(depthFromStart[id] ?? -1);
  } else {
    s.outDegrees.push(outgoingTargets(scene).length);
  }
}

function median(nums: number[]): number | "-" {
  if (nums.length === 0) return "-";
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

console.log(`\n--- Gren-statistikk per spor ---`);
for (const [track, s] of Object.entries(stats).sort(([a], [b]) => a.localeCompare(b))) {
  const talkNodes = s.question + s.conversation;
  const decisionNodes = s.choice + talkNodes; // scener som ikke er en ending
  const talkShare = decisionNodes > 0 ? ((talkNodes / decisionNodes) * 100).toFixed(0) : "-";
  const depths = s.endingDepths.filter((d) => d >= 0);
  const minDepth = depths.length ? Math.min(...depths) : "-";
  const maxDepth = depths.length ? Math.max(...depths) : "-";
  const avgOutDeg = s.outDegrees.length ? (s.outDegrees.reduce((a, b) => a + b, 0) / s.outDegrees.length).toFixed(2) : "-";
  console.log(
    `${track.padEnd(8)} scener=${s.scenes.toString().padEnd(4)} choice=${s.choice.toString().padEnd(3)} question=${s.question
      .toString()
      .padEnd(3)} conversation=${s.conversation.toString().padEnd(3)} ending=${s.ending.toString().padEnd(3)} ` +
      `| snakkeoppgave-andel=${talkShare}% (mål: ~33%) | slutt-dybde min/median/maks=${minDepth}/${median(depths)}/${maxDepth} | snitt forgrening=${avgOutDeg}`
  );
}
console.log(`(Kjør med --json for maskinlesbar output.)`);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(stats, null, 2));
}
