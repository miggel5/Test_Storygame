import { decodeRle } from "../src/engine/pixelCodec.ts";
import type { NextRef, Transition } from "../src/types/story.ts";
import { loadSource, trackOf, type SourceScene } from "./storyBuild.ts";

const asJson = process.argv.includes("--json");
const log = (...args: unknown[]) => {
  if (!asJson) console.log(...args);
};

const story = loadSource();
const errors: string[] = [];
const warnings: string[] = [];

function refTargets(ref: NextRef): string[] {
  return typeof ref === "string" ? [ref] : ref.random.map((o) => o.next);
}

function transitionsOf(scene: SourceScene): Transition[] {
  switch (scene.interaction) {
    case "choice":
      return scene.choices;
    case "question":
      return [scene.onCorrect, scene.onIncorrect];
    case "conversation": {
      const t = scene.outcomeTransitions;
      return [t.success, t.failure, ...(t.twist ? [t.twist] : [])].filter(Boolean);
    }
    case "ending":
      return [];
  }
}

function outgoingTargets(scene: SourceScene): string[] {
  return transitionsOf(scene).flatMap((t) => refTargets(t.next));
}

/** Every value any transition can assign to a flag, to catch conditions nothing can satisfy. */
const settableFlags = new Map<string, Set<string>>();
function noteFlags(flags: Record<string, unknown> | undefined) {
  for (const [flag, value] of Object.entries(flags ?? {})) {
    if (!settableFlags.has(flag)) settableFlags.set(flag, new Set());
    settableFlags.get(flag)?.add(JSON.stringify(value));
  }
}
for (const scene of Object.values(story.scenes)) {
  for (const t of transitionsOf(scene)) {
    noteFlags(t.setFlags);
    if (typeof t.next !== "string") t.next.random.forEach((o) => noteFlags(o.setFlags));
  }
}

/**
 * Forward dataflow over the scene graph: for each scene, which values can each condition-relevant flag
 * have when the player arrives (UNSET = never assigned on some path)? Used to prove that choice scenes
 * with only conditional choices always leave at least one choice available.
 */
const UNSET = "∅";
const flagValuesOnEntry = new Map<string, Map<string, Set<string>>>();
{
  const watched = new Set<string>();
  for (const scene of Object.values(story.scenes)) {
    if (scene.interaction === "choice") scene.choices.forEach((c) => c.condition && watched.add(c.condition.flag));
  }
  const entryOf = (id: string) => {
    let state = flagValuesOnEntry.get(id);
    if (!state) flagValuesOnEntry.set(id, (state = new Map([...watched].map((f) => [f, new Set<string>()]))));
    return state;
  };
  if (story.scenes[story.start]) {
    const initial = entryOf(story.start);
    for (const flag of watched) initial.get(flag)?.add(UNSET);
    const work = [story.start];
    while (work.length > 0) {
      const id = work.pop() as string;
      const from = entryOf(id);
      const scene = story.scenes[id];
      if (!scene) continue;
      for (const t of transitionsOf(scene)) {
        const outcomes = typeof t.next === "string" ? [{ next: t.next, flags: {} }] : t.next.random.map((o) => ({ next: o.next, flags: o.setFlags ?? {} }));
        for (const { next, flags: optionFlags } of outcomes) {
          if (!story.scenes[next]) continue;
          const assigned: Record<string, unknown> = { ...t.setFlags, ...optionFlags };
          const to = entryOf(next);
          let changed = false;
          for (const flag of watched) {
            const incomingValues = flag in assigned ? [JSON.stringify(assigned[flag])] : [...(from.get(flag) ?? [])];
            for (const value of incomingValues) {
              if (!to.get(flag)?.has(value)) {
                to.get(flag)?.add(value);
                changed = true;
              }
            }
          }
          if (changed) work.push(next);
        }
      }
    }
  }
}

if (!story.scenes[story.start]) {
  errors.push(`story.start ("${story.start}") peker ikke på en eksisterende scene.`);
}

for (const [sceneId, scene] of Object.entries(story.scenes)) {
  const where = `Scene "${sceneId}"`;

  for (const t of transitionsOf(scene)) {
    if (typeof t.next !== "string") {
      if (t.next.random.length === 0) errors.push(`${where} har en tom random-liste.`);
      if (t.next.random.some((o) => (o.weight ?? 1) <= 0)) errors.push(`${where} har en random-vekt <= 0.`);
    }
  }
  for (const target of outgoingTargets(scene)) {
    if (!story.scenes[target]) errors.push(`${where} refererer til ukjent scene "${target}".`);
  }

  if (scene.image) {
    const { width, height, palette, rle, glowPixels } = scene.image;
    const total = rle.reduce((sum, v, i) => (i % 2 === 1 ? sum + v : sum), 0);
    if (rle.length % 2 !== 0 || total !== width * height) {
      errors.push(`${where}: kunst dekoderer til ${total} piksler, forventet ${width * height}.`);
    } else if (decodeRle(rle, width, height).some((i) => i < -1 || i >= palette.length)) {
      errors.push(`${where}: kunst bruker palett-indeks utenfor paletten (${palette.length} farger).`);
    }
    if (glowPixels?.some((g) => g.x < 0 || g.y < 0 || g.x >= width || g.y >= height)) {
      errors.push(`${where}: glowPixel utenfor bildet.`);
    }
  }

  if (scene.interaction === "choice") {
    if (scene.choices.length === 0) errors.push(`${where} (choice) har ingen valg.`);
    const keys = scene.choices.map((c) => c.id ?? c.text);
    if (new Set(keys).size !== keys.length) errors.push(`${where} har valg med samme id/tekst (trenger unik "id").`);
    for (const choice of scene.choices) {
      const cond = choice.condition;
      if (!cond) continue;
      const values = settableFlags.get(cond.flag);
      if (!values) {
        errors.push(`${where}: valg "${choice.text}" krever flagget "${cond.flag}", men ingen setter det.`);
      } else if (!values.has(JSON.stringify(cond.equals))) {
        errors.push(`${where}: valg "${choice.text}" krever ${cond.flag}=${JSON.stringify(cond.equals)}, men ingen setter den verdien.`);
      }
    }
    if (scene.choices.length > 0 && scene.choices.every((c) => c.condition)) {
      const flagNames = new Set(scene.choices.map((c) => c.condition?.flag));
      if (flagNames.size > 1) {
        warnings.push(`${where} (choice) har bare betingede valg på flere flagg - kan ikke bevise at et alltid er tilgjengelig.`);
      } else {
        const [flag] = [...flagNames] as string[];
        const satisfiable = new Set(scene.choices.map((c) => JSON.stringify(c.condition?.equals)));
        for (const value of flagValuesOnEntry.get(sceneId)?.get(flag) ?? []) {
          if (!satisfiable.has(value)) {
            const shown = value === UNSET ? "(ikke satt)" : value;
            errors.push(`${where} (choice): kan nås med ${flag}=${shown}, og da er ingen valg tilgjengelige (spilleren står fast).`);
          }
        }
      }
    }
  }
  if (scene.interaction === "question") {
    if (scene.acceptedAnswers.length === 0) warnings.push(`${where} (question) har ingen acceptedAnswers.`);
    if (scene.maxAttempts !== undefined && scene.maxAttempts < 1) errors.push(`${where}: maxAttempts må være minst 1.`);
    if (refTargets(scene.onIncorrect.next).includes(sceneId) && scene.maxAttempts !== undefined) {
      warnings.push(`${where} (question) sender feil svar tilbake til seg selv etter maxAttempts - ingen fiasko-sti.`);
    }
  }
  if (scene.interaction === "conversation") {
    if (!scene.systemPrompt?.trim()) errors.push(`${where} (conversation) mangler systemPrompt.`);
    if (!scene.outcomeTransitions.success || !scene.outcomeTransitions.failure) {
      errors.push(`${where} (conversation) mangler success- eller failure-overgang.`);
    }
  }
}

// Breadth-first from the start: depth per scene (also gives reachability).
const depthFromStart = new Map<string, number>();
if (story.scenes[story.start]) {
  depthFromStart.set(story.start, 0);
  const queue = [story.start];
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    const scene = story.scenes[id];
    if (!scene) continue;
    for (const target of outgoingTargets(scene)) {
      if (!depthFromStart.has(target)) {
        depthFromStart.set(target, (depthFromStart.get(id) ?? 0) + 1);
        queue.push(target);
      }
    }
  }
}

const unreachable = Object.keys(story.scenes).filter((id) => !depthFromStart.has(id));
if (unreachable.length > 0) {
  warnings.push(`Uoppnåelige scener (ikke nåbare fra "${story.start}"): ${unreachable.join(", ")}`);
}

// Reverse reachability: every scene should be able to reach some ending.
const incoming = new Map<string, string[]>();
for (const [id, scene] of Object.entries(story.scenes)) {
  for (const target of outgoingTargets(scene)) {
    if (!incoming.has(target)) incoming.set(target, []);
    incoming.get(target)?.push(id);
  }
}
const canFinish = new Set<string>(Object.keys(story.scenes).filter((id) => story.scenes[id].interaction === "ending"));
{
  const queue = [...canFinish];
  for (let head = 0; head < queue.length; head++) {
    for (const from of incoming.get(queue[head]) ?? []) {
      if (!canFinish.has(from)) {
        canFinish.add(from);
        queue.push(from);
      }
    }
  }
}
const noExit = Object.keys(story.scenes).filter((id) => depthFromStart.has(id) && !canFinish.has(id));
if (noExit.length > 0) errors.push(`Scener som aldri kan nå en slutt: ${noExit.join(", ")}`);

const endingCategories = new Set(
  Object.values(story.scenes).flatMap((s) => (s.interaction === "ending" ? [s.endingCategory] : []))
);
log(`Slutt-kategorier som finnes i historien: ${[...endingCategories].join(", ") || "(ingen)"}`);

for (const w of warnings) console.warn(`Advarsel: ${w}`);
for (const e of errors) console.error(`Feil: ${e}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} feil funnet.`);
  process.exit(1);
}
log(`\nOK - ${Object.keys(story.scenes).length} scener, ${warnings.length} advarsel(er).`);

// --- Gren-statistikk: dybde, forgrening og oppgavetype per spor ---
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
  const track = id === story.start ? "root" : trackOf(id);
  const s = (stats[track] ??= { scenes: 0, choice: 0, question: 0, conversation: 0, ending: 0, endingDepths: [], outDegrees: [] });
  s.scenes++;
  s[scene.interaction]++;
  if (scene.interaction === "ending") {
    s.endingDepths.push(depthFromStart.get(id) ?? -1);
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

if (asJson) {
  console.log(JSON.stringify(stats, null, 2));
} else {
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
      `${track.padEnd(8)} scener=${String(s.scenes).padEnd(4)} choice=${String(s.choice).padEnd(3)} question=${String(s.question).padEnd(3)} ` +
        `conversation=${String(s.conversation).padEnd(3)} ending=${String(s.ending).padEnd(3)} ` +
        `| snakkeoppgave-andel=${talkShare}% (mål: ~33%) | slutt-dybde min/median/maks=${minDepth}/${median(depths)}/${maxDepth} | snitt forgrening=${avgOutDeg}`
    );
  }
  console.log(`(Kjør med --json for maskinlesbar output.)`);
}
