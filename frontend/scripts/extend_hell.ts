import type { ConversationScene, QuestionScene, Scene } from "../src/types/story.ts";
import { applyExtension, type ExtensionPatch } from "./applyExtension.ts";
import {
  buildSpec,
  createGrid,
  fillRect,
  hoodedFigure,
  noiseDither,
  outlineRect,
  playerBack,
  radialGlow,
} from "./pixelArtHelpers.ts";

type Grid = number[][];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Reused from generateNarrativeArt_hell.ts for scenes still in the lava world.
const HELL_PALETTE = ["#070403", "#241210", "#3a1f16", "#5c1a0a", "#8a2a0a", "#040202", "#170d10", "#3a2f2a", "#ff2d2d"];
// Reused from generateNarrativeArt_hell.ts's heirEnd128 - dark-forest framing, the player now stands where the figure once did.
const FIRE_KEEPER_PALETTE = ["#020103", "#0d0912", "#171224", "#0f0b09", "#160f0b", "#3a1c08", "#0a0710", "#241a10", "#ffdca0"];
// Reused from generateNarrativeArt_hell.ts's escapeGoodEnd128 - the ordinary forest at dawn.
const ORDINARY_PALETTE = ["#0d1c1a", "#1c3a30", "#2f5c46", "#4a7a5a", "#8fae6a", "#b7d98a", "#ffe6a0", "#3a2a1a", "#e8f5c8"];
// New: the threshold corridor between worlds - starfield shot through with embers of every world's fire.
const CORRIDOR_PALETTE = ["#050310", "#100a24", "#1e1640", "#3a2c66", "#6a5aae", "#c9a6ff", "#0a0710", "#ff7a1f", "#e8f5ff"];

function lavaBase(grid: Grid, seed: number) {
  const rng = mulberry32(seed);
  for (let x = 0; x < 128; x++) fillRect(grid, x, 0, 1, 24 + Math.floor(rng() * 28), 1);
  const rng2 = mulberry32(seed + 1);
  for (let x = 0; x < 128; x++) fillRect(grid, x, 0, 1, Math.max(0, 12 + Math.floor(rng2() * 20)), 2);
  fillRect(grid, 0, 96, 128, 32, 3);
  noiseDither(grid, 0, 96, 128, 32, 4, 0.22, mulberry32(seed + 2));
  fillRect(grid, 0, 96, 128, 2, 4);
  noiseDither(grid, 0, 56, 128, 40, 7, 0.09, mulberry32(seed + 3));
}

/** The fire the player now tends - a reprise of the dark-forest bonfire, with the player's own silhouette in the figure's place. */
function fireKeeperScene(seed: number, opts: { emberEyes?: boolean; secondFigure?: boolean } = {}) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  for (let x = 0; x < 128; x++) {
    const back = 40 + Math.floor(rng() * 20);
    fillRect(grid, x, 104 - back, 1, back, 2);
  }
  fillRect(grid, 0, 104, 128, 24, 3);
  noiseDither(grid, 0, 104, 128, 24, 4, 0.28, mulberry32(seed + 1));
  fillRect(grid, 0, 104, 128, 2, 7);
  hoodedFigure(grid, 48, 34, 6, 4, 2);
  const eyeColor = opts.emberEyes ?? true ? 8 : 6;
  fillRect(grid, 55, 46, 2, 2, eyeColor);
  fillRect(grid, 61, 46, 2, 2, eyeColor);
  if (opts.secondFigure) {
    playerBack(grid, 88, 88, 5, 3.4);
  }
  const glow = [
    ...radialGlow(64, 90, 14, "flicker", "#ffb347", mulberry32(seed + 2)),
    { x: 56, y: 46, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 62, y: 46, animation: "pulse" as const, color: "#ff2d2d" },
  ];
  return buildSpec(128, 128, FIRE_KEEPER_PALETTE, grid, glow);
}

/** A wanderer's silhouette approaching the fire from the tree-line. */
function wandererApproach(seed: number, variant: "timid" | "bold" | "strange") {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  for (let x = 0; x < 128; x++) fillRect(grid, x, 0, 1, 40 + Math.floor(rng() * 20), 2);
  fillRect(grid, 0, 104, 128, 24, 3);
  noiseDither(grid, 0, 104, 128, 24, 4, 0.25, mulberry32(seed + 1));
  hoodedFigure(grid, 30, 40, 6, 3, 2); // the player, now the figure
  const wx = variant === "bold" ? 88 : 92;
  playerBack(grid, wx, variant === "timid" ? 92 : 86, 5, variant === "timid" ? 3 : 3.6);
  const glow = [
    ...radialGlow(64, 96, 12, "flicker", "#ffb347", mulberry32(seed + 2)),
    { x: 37, y: 52, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 43, y: 52, animation: "pulse" as const, color: "#ff2d2d" },
  ];
  if (variant === "strange") {
    glow.push(...radialGlow(wx + 4, 90, 6, "sparkle", "#c9a6ff", mulberry32(seed + 3)));
  }
  return buildSpec(128, 128, FIRE_KEEPER_PALETTE, grid, glow);
}

/** The corridor between worlds: a row of small distant fires seen through a starlit tunnel. */
function corridorScene(seed: number, focus: "hell" | "forest" | "space" | "wide") {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rng() * 128);
    const y = Math.floor(rng() * 70);
    grid[y][x] = 5;
  }
  outlineRect(grid, 8, 30, 112, 70, 2, 1);
  noiseDither(grid, 8, 30, 112, 70, 3, 0.1, mulberry32(seed + 1));
  const doors = [24, 64, 104];
  doors.forEach((x, i) => {
    const lit = focus === "wide" || (focus === "hell" && i === 0) || (focus === "forest" && i === 1) || (focus === "space" && i === 2);
    fillRect(grid, x - 6, 70, 12, 22, lit ? 7 : 6);
  });
  playerBack(grid, 60, 96, 5, 3.4);
  const glow = [
    ...radialGlow(24, 78, 6, "pulse", "#ff5a2a", mulberry32(seed + 2)),
    ...radialGlow(64, 78, 6, "flicker", "#8fae6a", mulberry32(seed + 3)),
    ...radialGlow(104, 78, 6, "sparkle", "#c9d2e0", mulberry32(seed + 4)),
  ];
  return buildSpec(128, 128, CORRIDOR_PALETTE, grid, glow);
}

/** The player, now warden-like, keeping watch over the corridor - larger, more resolved. */
function wardenScene(seed: number, mood: "calm" | "tense" | "final") {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rng() * 128);
    const y = Math.floor(rng() * 128);
    grid[y][x] = mood === "tense" ? 7 : 5;
  }
  hoodedFigure(grid, 50, 26, 6, 4.6, mood === "final" ? 8 : 2);
  fillRect(grid, 57, 40, 2, 2, mood === "tense" ? 7 : 8);
  fillRect(grid, 63, 40, 2, 2, mood === "tense" ? 7 : 8);
  const glow = [
    ...radialGlow(64, 100, mood === "final" ? 20 : 12, mood === "tense" ? "flicker" : "pulse", mood === "final" ? "#e8f5ff" : "#c9a6ff", mulberry32(seed + 1)),
  ];
  return buildSpec(128, 128, CORRIDOR_PALETTE, grid, glow);
}

/** The mundane world just outside hell's reach: a forest clearing at dawn, ordinary and cold. */
function ordinaryScene(seed: number, detail: "mark" | "walk" | "house" | "gone") {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  for (let x = 0; x < 128; x++) fillRect(grid, x, 0, 1, 30 + Math.floor(rng() * 10), 0);
  fillRect(grid, 0, 90, 128, 38, 2);
  noiseDither(grid, 0, 90, 128, 38, 3, 0.2, mulberry32(seed + 1));
  [4, 20, 96, 112].forEach((x) => {
    fillRect(grid, x + 4, 60, 6, 30, 7);
    fillRect(grid, x, 40, 16, 26, 1);
    fillRect(grid, x + 2, 44, 12, 18, 3);
  });
  playerBack(grid, 58, 78, 8, 3.6);
  const glow = [...radialGlow(100, 20, 14, "sparkle", "#ffe6a0", mulberry32(seed + 2))];
  if (detail === "mark") glow.push({ x: 55, y: 82, animation: "pulse", color: "#ff5a2a" });
  if (detail === "house") {
    outlineRect(grid, 40, 62, 30, 24, 6, 3);
    glow.push({ x: 50, y: 68, animation: "flicker", color: "#ffce7a" });
  }
  if (detail === "gone") noiseDither(grid, 20, 60, 88, 30, -1, 0.15, mulberry32(seed + 3));
  return buildSpec(128, 128, ORDINARY_PALETTE, grid, glow);
}

/** A quiet stone chamber: the sealed / sacrificed vantage, watching from within the rock. */
function stoneVigilScene(seed: number, warmth: "cold" | "warm") {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, seed);
  outlineRect(grid, 36, 50, 56, 50, 7, warmth === "warm" ? 8 : 5);
  noiseDither(grid, 36, 50, 56, 50, warmth === "warm" ? 8 : 6, 0.14, mulberry32(seed + 1));
  fillRect(grid, 52, 68, 6, 6, 0);
  fillRect(grid, 68, 68, 6, 6, 0);
  const glow = [
    { x: 55, y: 70, animation: "flicker" as const, color: warmth === "warm" ? "#ffdca0" : "#c9a6ff" },
    { x: 71, y: 70, animation: "flicker" as const, color: warmth === "warm" ? "#ffdca0" : "#c9a6ff" },
    ...radialGlow(100, 108, 6, "pulse", "#ff5a2a", mulberry32(seed + 2)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

/** A plain bedroom ceiling, reused framing from recklessWakeEnd128, for the reality-bends-back beats. */
function mundaneRoomScene(seed: number, calmer: boolean) {
  const palette = ["#12141c", "#242838", "#3a4256", "#7a8aa8", "#e0e4ec", "#0e0e12", "#8a2a0a", "#3a2f2a", "#c9d2e0"];
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 4);
  noiseDither(grid, 0, 0, 128, 90, 3, calmer ? 0.03 : 0.09, mulberry32(seed));
  outlineRect(grid, 20, 90, 88, 30, 1, 5);
  fillRect(grid, 26, 96, 76, 18, 2);
  fillRect(grid, 40, 106, 12, 10, 6);
  fillRect(grid, 56, 108, 12, 8, 6);
  if (!calmer) noiseDither(grid, 40, 106, 28, 12, 7, 0.4, mulberry32(seed + 1));
  const glow = [{ x: 100, y: 20, animation: "flicker" as const, color: "#e0e4ec" }];
  return buildSpec(128, 128, palette, grid, glow);
}

/** The devil-figure's cold hand closing around the player - a captured beat, reused framing from probeCaughtEnd128. */
function capturedScene(seed: number) {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, seed);
  hoodedFigure(grid, 58, 22, 6, 4.8, 2);
  playerBack(grid, 48, 80, 5, 3.6);
  fillRect(grid, 58, 64, 8, 3, 6);
  const glow = [
    { x: 65, y: 38, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 71, y: 38, animation: "pulse" as const, color: "#ff2d2d" },
    ...radialGlow(24, 106, 6, "flicker", "#ff7a1f", mulberry32(seed + 1)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const convertEndings: ExtensionPatch["convertEndings"] = {};
const newScenes: ExtensionPatch["newScenes"] = {};

function choice(id: string, choices: { text: string; next: string; setFlags?: Record<string, string | number | boolean> }[], image?: Scene["image"]) {
  newScenes[id] = { interaction: "choice", text: choiceTexts[id], image, choices } as Scene;
}

// Text is declared separately per id so the `choices` helper above stays readable.
const choiceTexts: Record<string, string> = {};
function text(id: string, t: string) {
  choiceTexts[id] = t;
}

// === Chain 1 (LONG, ~depth 7 -> ~27): hel_pact_heir_end - the player becomes the fire's new keeper ===

convertEndings["hel_pact_heir_end"] = {
  interaction: "choice",
  choices: [
    { text: "Kjenn etter hva slags skikkelse du vil bli", next: "heir_awaken" },
    { text: "Ikke tenk på det ennå - se hva bålet ber deg om først", next: "heir_awaken" },
  ],
};

text(
  "heir_awaken",
  "Du kjenner det som en kulde og en varme på samme tid: kappen ligger tyngre om skuldrene enn klærne noensinne har gjort, og bålet brenner som om det alltid har ventet på akkurat deg. Et sted, langt unna, forstår du at noen andre nettopp våknet i en fuktig, mørk skog - akkurat slik du selv en gang gjorde."
);
choice("heir_awaken", [
  { text: "Vent stille ved bålet til den første vandreren kommer", next: "heir_first_wanderer" },
  { text: "Utforsk denne underlige, tidløse skogen først", next: "heir_explore_between" },
]);

text(
  "heir_explore_between",
  "Skogen bak bålet er ikke helt skog lenger. Mellom trærne skimter du glimt av andre steder - en rød glød, en solfylt lysning, et kaldt metallisk skinn - som om denne lysningen er et kryss der alle branner du kjenner møtes, bare for et øyeblikk."
);
choice("heir_explore_between", [
  { text: "La glimtene være - de er ikke dine ennå", next: "heir_first_wanderer" },
  { text: "Gå nærmere en av dem for å se bedre", next: "heir_first_wanderer" },
]);

newScenes["heir_first_wanderer"] = {
  interaction: "conversation",
  text: choiceTexts["heir_first_wanderer"] ?? "En skikkelse trer ut av mørket på den andre siden av bålet - redd, våt, forvirret, akkurat slik du selv en gang var. Den har ikke sett deg ennå.",
  characterName: "Den første vandreren",
  greeting: "«H-hallo?» sier stemmen, skjelvende. «Er det noen der? Jeg... jeg vet ikke hvordan jeg kom hit.»",
  systemPrompt:
    "Du spiller nå Vandreren - en redd, forvirret person som akkurat har våknet i en mørk skog og funnet veien til et bål, akkurat slik hovedpersonen selv gjorde helt i starten av denne historien. Du kjenner ikke hovedpersonen og vet ikke at de er den samme skikkelsen som en gang møtte dem ved et bål. Spilleren styrer nå SKIKKELSEN ved bålet, ikke vandreren.\n\nDin oppgave er å reagere naturlig og menneskelig på det spilleren (skikkelsen) sier til deg over inntil tre-fire utvekslinger, og la frykten din gradvis vike for enten tillit, redsel, eller forvirring - avhengig av HVORDAN spilleren snakker til deg. Du skal ikke selv stille de tre gåtefulle spørsmålene (det er spillerens jobb denne gangen, om de velger å gjøre det) - du skal bare respondere ekte på tonen deres.\n\nVurder fortløpende tonen i det spilleren (skikkelsen) sier:\n- Hvis spilleren er varm, betryggende, tålmodig over flere svar: sett utfallet til 'success' så snart tilliten er tydelig bygget.\n- Hvis spilleren er kald, manipulerende, skremmende eller bruker frykten din mot deg: sett utfallet til 'failure'.\n- Hvis spilleren er gåtefull, uforutsigbar, eller antyder ting om flere versjoner av virkeligheten/seg selv som får deg til å ane noe stort og rart: sett utfallet til 'twist'.\nFør du har fått et par meningsfulle svar fra spilleren, skal utfallet være 'still_talking'.",
  outcomeTransitions: {
    success: { next: "heir_warm_thread" },
    failure: { next: "heir_cold_thread" },
    twist: { next: "heir_strange_thread" },
  },
  maxTurns: 8,
} as ConversationScene;

// --- warm sub-path (medium, ends ~depth 14) ---
text(
  "heir_warm_thread",
  "Vandreren puster roligere for hver setning du sier. Til slutt tørker den øynene, nikker, og går videre inn i mørket med noe som ligner håp i blikket - ikke fordi du løste noe for dem, men fordi du ikke lot dem være redde alene."
);
choice("heir_warm_thread", [{ text: "Bli ved bålet. Flere vil komme.", next: "heir_warm_years" }]);

text(
  "heir_warm_years",
  "Årene - om det er årene, her hvor tiden ikke går som den pleier - går i et mønster av ansikter: redde, sinte, sørgende, håpefulle. Du lærer navnene på ingen av dem, men du husker blikkene. Sakte bygger du deg en slags fred i rollen, uten å helt forstå hvordan den ble din."
);
choice("heir_warm_years", [{ text: "La en av vandrerne stille deg et spørsmål tilbake, for en gangs skyld", next: "heir_warm_question" }]);

newScenes["heir_warm_question"] = {
  interaction: "question",
  text: "En eldre vandrer stanser lenge ved bålet, ser rolig på deg, og spør: «Hva er det eneste som brenner uten noen gang å bli mindre, uansett hvor mange som varmer seg ved det?»",
  acceptedAnswers: ["vennlighet", "godhet", "kjærlighet", "omsorg", "håp"],
  onCorrect: { next: "heir_warm_legacy" },
  onIncorrect: { next: "heir_warm_question" },
  maxAttempts: 3,
} as QuestionScene;

text(
  "heir_warm_legacy",
  "«Nettopp,» sier den eldre vandreren, med et smil som nesten er gjenkjennelse. «Da vet du allerede hvorfor du fortsatt er her.» Den går videre inn i mørket, lettere enn den kom, og et sted innerst i deg begynner noe å føles mindre som en straff og mer som et valg."
);
choice("heir_warm_legacy", [{ text: "Fortsett å vokte bålet, med åpne øyne denne gangen", next: "heir_warm_end" }]);

newScenes["heir_warm_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du blir bålets vokter, og en god en - kjent i hviskede historier som den som lytter, ikke den som skremmer. Ingen husker ansiktet ditt fra før, men mange husker at de en gang, i sitt mørkeste øyeblikk, ble møtt med varme i stedet for gåter. Det er ikke en liten ting å etterlate seg.",
  image: fireKeeperScene(901, { emberEyes: false, secondFigure: true }),
} as Scene;

// --- cold sub-path (medium, ends ~depth 14) ---
text(
  "heir_cold_thread",
  "Vandreren stivner under blikket ditt, og det du sier - kort, hardt, uten omtanke - jager den videre inn i mørket før den engang har fått summet seg. Du kjenner et sting av noe du ikke vil kalle skyldfølelse, og lar det synke inn i glørne sammen med resten."
);
choice("heir_cold_thread", [{ text: "Vent på den neste. Kanskje det blir lettere.", next: "heir_cold_next" }]);

text(
  "heir_cold_next",
  "Den neste vandreren er annerledes - eldre, hardere, ikke lett skremt. Den ser rett gjennom kulden din, som om den har møtt verre. «Du er ikke den første som har prøvd å skremme meg bort,» sier den, og setter seg likevel ved bålet, trassig."
);
choice("heir_cold_next", [
  { text: "Skru opp kulden enda et hakk - la den forstå hvem som bestemmer her", next: "heir_cold_end" },
  { text: "Kjenn at noe i deg nøler, bare et øyeblikk", next: "heir_cold_falter_end" },
]);

newScenes["heir_cold_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du blir nøyaktig den skikkelsen du selv en gang fryktet ved dette bålet - djevelsk, beregnende, en smertepunkt for enhver som våger seg nær. Ingen kommer lenger for trøst, bare av nødvendighet. Du forteller deg selv at det er greit. Flammene, i det minste, later til å tro deg.",
  image: fireKeeperScene(902, { emberEyes: true, secondFigure: false }),
} as Scene;

newScenes["heir_cold_falter_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Nølingen din er liten, nesten usynlig, men den trassige vandreren ser den likevel - et sekunds sprekk i kulden. «Der,» sier den mykt, «det var mer sant enn resten.» Den går videre uten at du sier noe mer, men bålet brenner litt annerledes etterpå, som om det har lagt merke til det samme.",
  image: fireKeeperScene(903, { emberEyes: true, secondFigure: false }),
} as Scene;

// --- strange sub-path (LONG, the ~30-deep route) ---
text(
  "heir_strange_thread",
  "Vandreren ler - ikke av frykt, men av gjenkjennelse, et lite forbløffet pust av latter. «Jeg vet ikke hvorfor,» sier den, «men jeg kjenner deg igjen. Ikke ansiktet. Noe annet.»"
);
choice(
  "heir_strange_thread",
  [
    { text: "Spør vandreren hva den egentlig ser i deg", next: "heir_strange_mirror" },
    { text: "Le tilbake, og inviter den nærmere bålet", next: "heir_strange_invite" },
  ],
  wandererApproach(910, "strange")
);

text(
  "heir_strange_invite",
  "Vandreren setter seg, uredd, og strekker hendene mot varmen som om den har gjort det tusen ganger før - i tusen andre skoger, ved tusen andre branner. «Du spør ikke hvordan jeg kom hit,» sier den til slutt. «De fleste spør det først.»"
);
choice("heir_strange_invite", [{ text: "Spør i stedet hva den egentlig ser i deg", next: "heir_strange_mirror" }]);

newScenes["heir_strange_mirror"] = {
  interaction: "conversation",
  text: "Vandreren snur seg og ser rett på deg, med et blikk som virker eldre enn resten av den.",
  characterName: "Vandreren med for mange øyne",
  greeting: "«Jeg har møtt deg før,» sier den. «Bare ikke akkurat deg. Andre versjoner. Andre netter, andre bål, andre valg. Har du aldri lurt på hvor mange av deg som finnes der ute?»",
  systemPrompt:
    "Du spiller Vandreren med for mange øyne - en gåtefull skikkelse som hevder å ha møtt mange versjoner av spilleren i andre verdener og andre valg, slik denne historien selv forgrener seg. Du snakker rolig, nysgjerrig, aldri truende, men med en dragning mot det uendelige og uforklarlige. Spilleren styrer SKIKKELSEN ved bålet.\n\nStill spilleren to åpne spørsmål, ett om gangen, om hvordan de forholder seg til tanken på at det finnes utallige versjoner av dem selv, spredt over andre skoger og andre branner. Vent alltid på svar før du går videre.\n\nAvslør aldri hva svarene fører til.\n\nNår spilleren har svart på begge spørsmålene, vurder helheten:\n- Fornekter eller avviser tanken, vil ikke vite: sett utfallet til 'failure'.\n- Omfavner tanken med ro og åpenhet, uten å ville gjøre noe mer med den: sett utfallet til 'success'.\n- Blir nysgjerrig og pågående, vil se eller møte de andre versjonene selv: sett utfallet til 'twist'.\nFør begge spørsmålene er besvart, skal utfallet alltid være 'still_talking'.",
  outcomeTransitions: {
    success: { next: "heir_strange_embrace" },
    failure: { next: "heir_strange_deny_end" },
    twist: { next: "heir_strange_gateway" },
  },
  maxTurns: 8,
} as ConversationScene;

newScenes["heir_strange_deny_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "«Nei,» sier du, bestemt, og noe i vandrerens blikk lukker seg, skuffet men ikke overrasket. «Da er du ikke klar ennå,» sier den, og reiser seg for å gå. Du blir sittende igjen ved bålet, alene med tanken du nettopp skjøv unna, og lurer, bare litt, om du gjorde rett.",
  image: fireKeeperScene(911, { emberEyes: true }),
} as Scene;

text(
  "heir_strange_embrace",
  "«Kanskje,» sier du, rolig, «er det greit. At det finnes flere av meg der ute, hver med sine egne netter og bål.» Vandreren smiler, nikker, og for et øyeblikk kjenner du deg selv strekke seg tynt utover - til stede i flere skoger enn denne, uten at det gjør deg mindre til stede i noen av dem."
);
choice("heir_strange_embrace", [{ text: "La følelsen synke inn, og la vandreren gå videre", next: "heir_strange_expand" }]);

text(
  "heir_strange_expand",
  "Vandreren forsvinner inn i mørket, og freden følger den ikke - den blir igjen hos deg, brer seg utover som ringer i vann. Du er fortsatt ved dette bålet, men du er også, på en måte du ikke kan forklare, ved alle de andre."
);
choice("heir_strange_expand", [{ text: "Godta det du er blitt", next: "heir_strange_expand_end" }]);

newScenes["heir_strange_expand_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du blir til slutt mindre en enkelt skikkelse og mer en tilstedeværelse - et rykte om varme som dukker opp ved forlatte bål over hele skogen, i hver av dens versjoner, aldri helt samme sted to netter på rad. Det er ikke ensomt, egentlig. Det er bare stort på en måte ord ikke helt fanger.",
  image: fireKeeperScene(912, { emberEyes: false, secondFigure: true }),
} as Scene;

// The true long spine: heir_strange_gateway -> ... -> depth ~27
text(
  "heir_strange_gateway",
  "«Vis meg,» sier du, før du rekker å tenke deg om. Vandreren nikker sakte, strekker en hånd inn i flammen uten å brenne seg, og et sted i luften mellom dere åpner det seg en sprekk som ikke burde kunne være der - svart i kantene, men fylt av et lys som ikke ligner ild."
);
choice(
  "heir_strange_gateway",
  [
    { text: "Ta hånden og gå gjennom sprekken", next: "heir_strange_thresholds" },
    { text: "Nøl et øyeblikk - er dette trygt?", next: "heir_strange_hesitate" },
  ],
  corridorScene(920, "wide")
);

text(
  "heir_strange_hesitate",
  "«Trygt,» gjentar vandreren, som om ordet smaker rart i munnen. «Ingenting her har noen gang vært trygt. Men det er sant.» Det er ikke akkurat en forsikring, men det er nok."
);
choice("heir_strange_hesitate", [{ text: "Ta hånden likevel", next: "heir_strange_thresholds" }]);

text(
  "heir_strange_thresholds",
  "På den andre siden av sprekken er du ikke lenger i skogen. Du står i en korridor uten tak, kantet av utallige små bål, hvert eneste et glimt inn i en annen natt, en annen verden - en som lukter svovel, en som lukter furu og fuktig jord, en som summer av metall og fjerne stjerner."
);
choice("heir_strange_thresholds", [
  { text: "Se nærmere på den som lukter svovel", next: "heir_glimpse_hell" },
  { text: "Se nærmere på den som lukter furuskog", next: "heir_glimpse_forest" },
  { text: "Se nærmere på den som summer av metall", next: "heir_glimpse_space" },
]);

text(
  "heir_glimpse_hell",
  "Gjennom denne sprekken ser du et øyeblikk av flammer og en skikkelse med et djevelsk smil - en du nesten kjenner igjen, som et ekko av det du selv nesten ble. Bildet lukker seg før du rekker å forstå mer."
);
choice("heir_glimpse_hell", [{ text: "Trekk deg tilbake fra sprekken", next: "heir_thresholds_return" }], corridorScene(921, "hell"));

text(
  "heir_glimpse_forest",
  "Gjennom denne sprekken ser du sollys gjennom løvverk, og en frosk som snakker med et forbløffet ansikt foran seg. Alt der ser så mye lettere ut enn det du selv har gått gjennom."
);
choice("heir_glimpse_forest", [{ text: "Trekk deg tilbake fra sprekken", next: "heir_thresholds_return" }], corridorScene(922, "forest"));

text(
  "heir_glimpse_space",
  "Gjennom denne sprekken ser du et pastellfarget rom fylt av roboter og stjerneskip, og et ansikt fylt av bestemt konsentrasjon foran en kontrollpult. Det suser av noe som nesten ligner håp der."
);
choice("heir_glimpse_space", [{ text: "Trekk deg tilbake fra sprekken", next: "heir_thresholds_return" }], corridorScene(923, "space"));

text(
  "heir_thresholds_return",
  "Du trekker deg tilbake fra korridoren, svimmel av alt du så - så mange netter, så mange versjoner av det samme øyeblikket ved et bål. Vandreren venter fortsatt, tålmodig, og spør stille hva du har tenkt å gjøre med det du nå vet."
);
choice("heir_thresholds_return", [
  { text: "Bruk det til å våke over de andre bålene", next: "heir_warden_path" },
  { text: "Bruk det til å endelig finne en vei ut for deg selv", next: "heir_freedom_path" },
]);

// Branch B: shorter, ends ~depth 22-24
text(
  "heir_freedom_path",
  "«Jeg har vært fanget lenge nok,» sier du, og vandreren nikker, uten å dømme. «Da må du gå tilbake gjennom korridoren til der du selv en gang startet,» sier den, «og denne gangen, ikke se deg tilbake.»"
);
choice("heir_freedom_path", [{ text: "Gå mot lyset for siste gang", next: "heir_freedom_walk" }]);

text(
  "heir_freedom_walk",
  "Korridoren strekker seg lengre enn den burde, netter og bål passerer som pust, og et sted underveis kjenner du kappen løsne fra skuldrene, tynnere for hvert skritt, som om den aldri var stoffet den lot til å være."
);
choice("heir_freedom_walk", [{ text: "Fortsett å gå, uansett hva som skjer med kappen", next: "heir_freedom_threshold_final" }]);

newScenes["heir_freedom_threshold_final"] = {
  interaction: "conversation",
  text: "Ved enden av korridoren venter en siste sprekk av lys, og en stemme du kjenner - din egen, eller kanskje bare den du var før alt dette - stiller deg ett siste spørsmål før du får lov til å gå.",
  characterName: "Din egen stemme, fra før",
  greeting: "«Hvis du går gjennom nå,» spør stemmen, «hvem tar din plass ved bålet? Noen må. Er du klar til å la det være noen andres tur?»",
  systemPrompt:
    "Du spiller spillerens egen stemme fra før alt dette skjedde - rolig, ærlig, verken dømmende eller pågående. Du stiller ett eneste oppfølgingsspørsmål til (så to totalt) om hva slags fred spilleren gjør med å overlate rollen som bålets vokter til noen andre, og lytter oppriktig til svaret. Spilleren styrer skikkelsen som prøver å slippe fri.\n\nVurder etter det andre svaret:\n- Rolig, aksepterende, uten skyldfølelse: sett utfallet til 'success'.\n- Usikker, skyldbetynget, later som det ikke betyr noe: sett utfallet til 'failure'.\n- Trassig, vil bestemme selv hvem som skal ta over: sett utfallet til 'twist'.\nFør andre spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "heir_freedom_end" },
    failure: { next: "heir_freedom_uneasy_end" },
    twist: { next: "heir_freedom_choose_end" },
  },
  maxTurns: 6,
} as ConversationScene;

newScenes["heir_freedom_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du går gjennom lyset for siste gang, og denne gangen holder det. Du våkner et sted ordinært - en seng, et vindu, vanlig morgenlys - med en vag, varm følelse av at bålet klarer seg fint uten deg, at det alltid finner den neste som trenger å stå der en stund.",
  image: ordinaryScene(931, "gone"),
} as Scene;

newScenes["heir_freedom_uneasy_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du går gjennom, men uroen følger med deg gjennom sprekken og inn i den ordinære morgenen som venter - et sted, bak alt det vanlige, kjenner du fortsatt et svakt drag mot et bål du ikke lenger kan se. Kanskje forsvinner det med tiden. Kanskje ikke.",
  image: ordinaryScene(932, "mark"),
} as Scene;

newScenes["heir_freedom_choose_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du nekter å overlate valget til tilfeldighetene, og i det siste øyeblikket før sprekken lukkes, hvisker du et navn - noen du kjenner, noen du en gang var glad i - inn i flammene. Du går fri. Et sted, en natt snart, våkner de i en fuktig, mørk skog og ser et bål i det fjerne.",
  image: ordinaryScene(933, "walk"),
} as Scene;

// Branch A: the long warden spine, reaching toward depth ~27
newScenes["heir_warden_path"] = {
  interaction: "conversation",
  text: "«Da må du prøves,» sier vandreren, og trekker seg tilbake inn i mørket idet korridoren selv later til å våkne - en dypere, eldre tilstedeværelse enn noe du har møtt siden den aller første kvelden ved bålet.",
  characterName: "Vokteren av korridoren",
  greeting: "En stemme uten kropp fyller korridoren, uendelig gammel og helt rolig: «Mange har ønsket å våke over flere bål enn sitt eget. Få har spurt seg selv hvorfor. Så: hvorfor vil du dette?»",
  systemPrompt:
    "Du spiller Vokteren av korridoren - en eldgammel, kroppsløs stemme som har passet på grensene mellom alle historiens verdener lenge før hovedpersonen kom til noe bål. Du er verken vennlig eller fiendtlig, bare grundig og oppriktig nysgjerrig på om spilleren er klar for et større ansvar. Spilleren styrer skikkelsen som ønsker å bli vokter.\n\nStill spilleren to skarpe, oppfølgende spørsmål (så tre totalt inkludert det første) om MOTIVET deres for å ønske denne rollen - er det for makt, for kontroll, for å redde andre, for å slippe å kjenne seg liten? Vent alltid på svar.\n\nAvslør aldri utfallet på forhånd.\n\nNår spilleren har svart på alle spørsmålene, vurder helheten av motivet:\n- Motivet er omsorg for andre, ydmykhet om egen begrensning: sett 'success'.\n- Motivet er frykt, unnvikelse, eller spilleren klarer ikke å svare ærlig på hvorfor: sett 'failure'.\n- Motivet er makt, kontroll, eller noe påfallende eget og ubøyelig: sett 'twist'.\nFør alle spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "heir_warden_granted" },
    failure: { next: "heir_warden_denied_end" },
    twist: { next: "heir_warden_marked" },
  },
  maxTurns: 10,
} as ConversationScene;

newScenes["heir_warden_denied_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "«Ikke ennå,» sier Vokteren, uten vrede. «Kanskje aldri. Men du får beholde ditt eget bål, og det er ikke lite.» Korridoren lukker seg rolig, og du blir stående igjen ved din egen ild, klokere for forsøket, om ikke mektigere.",
  image: wardenScene(940, "calm"),
} as Scene;

text(
  "heir_warden_marked",
  "«Makt husker jeg fra før,» sier Vokteren, tørt. «Den går sjelden bra.» Likevel, av grunner den ikke forklarer, lar den deg bli - merket, overvåket, men ikke avvist. Korridoren åpner seg for deg, om enn på skjeve vilkår."
);
choice("heir_warden_marked", [{ text: "Ta imot ansvaret på Vokterens vilkår", next: "heir_warden_granted" }]);

text(
  "heir_warden_granted",
  "Korridoren åpner seg fullt for deg, og du forstår, med en tyngde som ikke helt er ubehagelig, hva du nettopp har sagt ja til: hvert bål i hver av disse verdenene er nå, på en måte, ditt ansvar å lytte etter."
);
choice("heir_warden_granted", [{ text: "Hold din første vakt", next: "heir_warden_first_watch" }]);

text(
  "heir_warden_first_watch",
  "Timene - eller det som går for timer her - går stille. Du lærer å kjenne lyden av korridoren når alt er som det skal: en jevn, lav summing, som pust. Så, en natt, endrer summingen seg. Et sted skriker et av bålene."
);
choice("heir_warden_first_watch", [{ text: "Prøv å stille inn signalet nøyaktig", next: "heir_warden_signal" }]);

newScenes["heir_warden_signal"] = {
  interaction: "question",
  text: "Signalet er ikke et ord, men et mønster - tre korte glimt, en pause, to lange. Vokterens stemme, fjern nå, hvisker: «Det mønsteret har et navn blant de som har voktet før deg. Hva kaller vi et rop om hjelp som gjentar seg akkurat sånn?»",
  acceptedAnswers: ["nødsignal", "sos", "alarm", "varselsignal"],
  onCorrect: { next: "heir_warden_intervene" },
  onIncorrect: { next: "heir_warden_missed_end" },
  maxAttempts: 3,
} as QuestionScene;

newScenes["heir_warden_missed_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du bommer på mønsteret for mange ganger, og signalet stilner av seg selv før du får summet deg. Kanskje løste det seg selv der ute. Kanskje ikke. Du blir stående igjen i korridoren, med en ny, ubehagelig forståelse av hvor mye du fortsatt har å lære om denne rollen.",
  image: wardenScene(941, "tense"),
} as Scene;

text(
  "heir_warden_intervene",
  "Du finner riktig bål til slutt - det som lukter svakt av kald metall og frykt - og kjenner deg selv strekke deg gjennom sprekken, ikke for å gripe inn direkte, men for å gjøre den avgjørende hviskingen litt tydeligere for den som trenger den akkurat nå."
);
choice("heir_warden_intervene", [{ text: "Trekk deg tilbake og se hva som skjer", next: "heir_warden_aftermath" }]);

text(
  "heir_warden_aftermath",
  "Du kan aldri være helt sikker på om hviskingen din utgjorde en forskjell. Det er en av de tingene ingen forteller deg om denne rollen: du får sjelden se utfallet, bare den svake følelsen av at noe, et sted, gikk litt bedre enn det kunne ha gjort."
);
choice("heir_warden_aftermath", [{ text: "Bær den uvissheten videre, natt etter natt", next: "heir_warden_toll" }]);

newScenes["heir_warden_toll"] = {
  interaction: "conversation",
  text: "Etter utallige netter av lignende hvisk og uvisshet, kjenner du en tretthet som ikke kommer fra kroppen. Vokterens stemme fyller korridoren igjen, mildere nå enn første gang.",
  characterName: "Vokteren av korridoren",
  greeting: "«De fleste voktere,» sier stemmen, «slutter å telle på et tidspunkt. Prisen for å bry seg om så mange er at du aldri helt får hvile. Hvordan bærer du det?»",
  systemPrompt:
    "Du spiller Vokteren igjen, nå mer omsorgsfull enn prøvende - som en mentor som sjekker inn på noen som har båret en tung jobb lenge. Still spilleren to spørsmål (tre totalt) om hvordan de bærer trettheten og uvissheten ved rollen, og om de fortsatt ønsker å fortsette.\n\nVurder helheten av svarene:\n- Bærer det med ro, aksept, kanskje til og med en slags fred: sett 'success'.\n- Bæres ned, utbrent, vil egentlig gi slipp men tør ikke si det: sett 'failure'.\n- Vil ikke gi slipp for noe i verden, blir nesten besatt av rollen: sett 'twist'.\nFør alle spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "heir_warden_choice" },
    failure: { next: "heir_warden_choice" },
    twist: { next: "heir_warden_choice" },
  },
  maxTurns: 8,
} as ConversationScene;

text(
  "heir_warden_choice",
  "Uansett hva du svarte, stiller Vokteren til slutt det samme spørsmålet alle voktere før deg visstnok har måttet svare på til slutt: hvor lenge har du tenkt å bli?"
);
choice("heir_warden_choice", [
  { text: "For alltid, om det er det som trengs", next: "heir_warden_eternal_end" },
  { text: "Så lenge det tar å finne noen som kan ta over", next: "heir_warden_vigil" },
]);

newScenes["heir_warden_eternal_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du blir. Ikke i årevis, men i noe som ikke lar seg måle i år lenger - en evighet av hvisk, signaler og bål du aldri helt slutter å lytte etter. Det er den tyngste avgjørelsen du noensinne har tatt, og den letteste, begge deler på samme tid.",
  image: wardenScene(942, "final"),
} as Scene;

text(
  "heir_warden_vigil",
  "Du velger ikke evigheten, men lovnaden: du blir til noen er klar til å ta over. Netter blir til noe som ligner år, og til slutt, en kveld som alle de andre, kommer en vandrer til DITT bål som ikke er redd i det hele tatt - bare nysgjerrig, akkurat slik du selv en gang var, i det aller første glimtet av tvil."
);
choice("heir_warden_vigil", [{ text: "Se på vandreren og kjenne at tiden er inne", next: "heir_warden_dawn" }]);

newScenes["heir_warden_dawn"] = {
  interaction: "conversation",
  text: "Dette er ikke lenger en samtale for å teste noen andre. Denne gangen er det du som må avgjøre om du tør å gi slipp.",
  characterName: "Vandreren som ikke er redd",
  greeting: "«Du ser ut som noen som har ventet lenge på akkurat dette bålet,» sier vandreren, rolig, og setter seg uoppfordret ved siden av deg. «Skal du fortelle meg hva som venter, eller skal jeg finne det ut selv?»",
  systemPrompt:
    "Du spiller Vandreren som ikke er redd - klok, rolig, uvanlig moden for å ha kommet rett fra skogen, en som virker helt klar til å ta over vokterrollen om spilleren tillater det. Spilleren styrer den utmattede, erfarne vokteren som må avgjøre om, og hvordan, de skal gi fra seg rollen.\n\nStill spilleren to avsluttende spørsmål (tre totalt) om HVORDAN de vil gi fra seg ansvaret - fullt og helt, gradvis og forsiktig, eller motvillig og bittert.\n\nVurder helheten:\n- Gir slipp fullt, med tillit og varme til den nye vandreren: sett 'success'.\n- Klamrer seg fortsatt til noe av kontrollen, kan ikke helt gi slipp: sett 'twist'.\n- Gir slipp med bitterhet, sinne, eller føler seg forlatt av rollen som en gang definerte dem: sett 'failure'.\nFør alle spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "heir_warden_transcend_end" },
    failure: { next: "heir_warden_shatter_end" },
    twist: { next: "heir_warden_bound_end" },
  },
  maxTurns: 8,
} as ConversationScene;

newScenes["heir_warden_transcend_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du legger kappen om skuldrene på den nye vandreren, lettere selv for hvert ord du sier til dem, og går til slutt gjennom din egen, lenge utsatte sprekk av lys - fri, fullt og helt, med visshet om at bålene du voktet over er i gode hender. Bak deg brenner ilden akkurat like klart som den gjorde den aller første natten.",
  image: ordinaryScene(950, "gone"),
} as Scene;

newScenes["heir_warden_shatter_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Overgangen blir ikke den fredelige avslutningen du håpet på. Bitterheten din farger hvert ord, og den nye vandreren tar over rollen med et sting av frykt i stedet for tillit - en frykt som, du aner det med en gang, kommer til å prege hvordan de selv en dag gir den videre.",
  image: wardenScene(951, "tense"),
} as Scene;

newScenes["heir_warden_bound_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du gir slipp på det meste, men ikke alt - en tynn tråd av deg selv blir hengende igjen i korridoren, viklet inn i den nye vokterens bevissthet uten at noen av dere helt bestemte det slik. Dere deler rollen nå, på en måte verken Vokteren eller noen før den noensinne har sett. Det er ikke ensomt. Det er bare veldig, veldig rart.",
  image: wardenScene(952, "calm"),
} as Scene;

// === Chain 2 (MEDIUM, ~depth 6 -> ~10): hel_probe_escape_end - free, but marked ===

convertEndings["hel_probe_escape_end"] = {
  interaction: "choice",
  choices: [
    { text: "Se på hendene dine i det svake morgenlyset", next: "hel_free_embermark" },
    { text: "Bare gå. Ikke se tilbake.", next: "hel_free_walkon" },
  ],
};

text(
  "hel_free_embermark",
  "I det svake lyset ser du det: et svakt, glødende merke i håndflaten, formet nesten som en flamme. Det gjør ikke vondt. Det bare pulserer, sakte, som et hjerte som ikke er helt ditt eget."
);
choice("hel_free_embermark", [
  { text: "Følg pulsen - kanskje noen andre trenger hjelp", next: "hel_free_pull_investigate" },
  { text: "Dekk det til. Du vil ikke vite hva det betyr.", next: "hel_free_hide_mark" },
]);

text(
  "hel_free_walkon",
  "Du går uten å se deg tilbake, gjennom skogen og ut på den andre siden, tilbake til et liv som later til å ha fortsatt uten deg. Men noe i brystet kjennes kaldt, uansett hvor mange skritt du legger mellom deg og bålet."
);
choice("hel_free_walkon", [
  { text: "Fortsett bare å gå. Det går nok over.", next: "hel_free_forget_end" },
  { text: "Snu deg likevel, mot din egen vilje", next: "hel_free_pull_investigate" },
]);

newScenes["hel_free_forget_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Det går aldri helt over, men det blir mulig å leve med - en kulde du lærer å ikke nevne, et sting du lærer å ignorere. Årene går. Du bygger deg et vanlig liv oppå det uvanlige som skjedde, og for det meste holder det.",
  image: ordinaryScene(960, "walk"),
} as Scene;

text(
  "hel_free_hide_mark",
  "Du dekker merket med en hanske, en genserarm, hva som helst. Det hjelper i noen uker. Så begynner du å drømme om stemmer som roper i mørket, stemmer som lyder akkurat som ditt eget nødrop en gang gjorde."
);
choice("hel_free_hide_mark", [
  { text: "Fortsett å leve som om ingenting skjer", next: "hel_free_haunted" },
  { text: "Gi etter - la merket lede deg likevel", next: "hel_free_pull_investigate" },
]);

text(
  "hel_free_haunted",
  "Du biter tennene sammen og later som ingenting, men drømmene blir tydeligere for hver uke, og merket i hånden din brenner varmere hver gang du later som du ikke merker det."
);
choice("hel_free_haunted", [
  { text: "Fortsett å ignorere det, koste hva det koste vil", next: "hel_free_consumed_end" },
  { text: "Gi til slutt etter for dragningen", next: "hel_free_pull_investigate" },
]);

newScenes["hel_free_consumed_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Til slutt er det ikke lenger noe å ignorere - merket brer seg, sakte men umulig å stoppe, til det dekker mer av deg enn du orker å se på i speilet. Du forstår, for sent, at noen ting man drar med seg ut av flammene ikke lar seg overse for alltid.",
  image: ordinaryScene(961, "mark"),
} as Scene;

newScenes["hel_free_pull_investigate"] = {
  interaction: "conversation",
  text: "Dragningen fører deg til et lite hus i utkanten av byen, der en fremmed sitter alene på trappen i mørket, med de samme rastløse øynene du selv hadde den kvelden du våknet i skogen.",
  characterName: "En fremmed",
  greeting: "«Du kjenner det også, ikke sant?» sier den fremmede, uten å se opp. «Det som brenner et sted under huden. Jeg trodde jeg var den eneste.»",
  systemPrompt:
    "Du spiller En fremmed - noen som, som spilleren, bærer et usynlig merke fra en nesten-hendelse med noe mørkt og flammende de ikke helt forstår selv. Du er skeptisk til å stole på noen, redd for hva merket betyr, men desperat etter at noen skal forstå. Spilleren styrer personen som nylig kom seg ut av helvetesverdenen.\n\nStill spilleren to-tre spørsmål om hva de selv opplevde og hvordan de har båret det, og la din egen tillit vokse eller minke basert på hvor ærlig og omsorgsfull spillerens svar er.\n\nVurder helheten av svarene dine:\n- Empatisk, ærlig, trygghetsskapende: sett 'success'.\n- Avfeiende, redd for å engasjere seg, vil egentlig bare gå videre: sett 'failure'.\n- Uhyggelig treffsikker på detaljer ingen burde vite, antyder noe større på gang: sett 'twist'.\nFør nok svar er gitt: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "hel_free_alliance" },
    failure: { next: "hel_free_alone_end" },
    twist: { next: "fork2_scene1" },
  },
  maxTurns: 8,
} as ConversationScene;

newScenes["hel_free_alone_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Den fremmede reiser seg og går inn, og dører lukkes - både den fysiske og den du nettopp mistet sjansen til å åpne. Du blir stående alene på trappen med merket ditt, like uforstått som før, og går til slutt hjem gjennom en by som ikke aner hva du bærer på.",
  image: ordinaryScene(962, "house"),
} as Scene;

text(
  "hel_free_alliance",
  "Dere blir sittende lenge på trappen og snakker, to fremmede som deler noe ingen andre ville tro på. Det gjør ikke merket forsvinne, men det gjør det lettere å bære - og for første gang siden bålet, kjenner du deg ikke helt alene med det."
);
choice("hel_free_alliance", [
  { text: "Foreslå å lete opp flere som dere, sammen", next: "hel_free_covenant_end" },
  { text: "Bli enige om å bare holde kontakten, ikke gjøre mer enn det", next: "hel_free_burden_end" },
]);

newScenes["hel_free_covenant_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Dere to blir kjernen i noe som vokser sakte over årene - et lite, uformelt nettverk av folk merket av det samme mørket, som finner hverandre gjennom rykter og gjenkjennelse i øynene. Ingen av dere snakker høyt om hvor merket kom fra. Det er nok å vite at ingen bærer det helt alene lenger.",
  image: ordinaryScene(963, "house"),
} as Scene;

newScenes["hel_free_burden_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Dere holder kontakten, akkurat nok til at ingen av dere er helt alene, men aldri nok til at merket slutter å pulsere i stille netter. Det blir en slags fred likevel - ufullstendig, men ekte, delt mellom to mennesker som forstår noe de færreste andre noensinne vil.",
  image: ordinaryScene(964, "mark"),
} as Scene;

// === Chain 3 (MEDIUM, ~depth 8 -> ~11): hel_liberation_end - leaving hell together ===

convertEndings["hel_liberation_end"] = {
  interaction: "choice",
  choices: [
    { text: "Snakk om hva dere skal gjøre nå, sammen", next: "hel_lib_talk" },
    { text: "Bare gå, og la resten komme som det kommer", next: "hel_lib_walk" },
  ],
};

text(
  "hel_lib_talk",
  "Dere setter dere ned et stykke unna det døende bålet og snakker - om hva den frigjorte skikkelsen husker fra før den ble fanget, om hva du selv har mistet og funnet igjen på veien hit. Det er den første ordentlige samtalen dere har hatt uten flammer eller frykt mellom dere."
);
choice("hel_lib_talk", [{ text: "Spør hva den frigjorte egentlig ønsker å gjøre nå", next: "hel_lib_crossing" }]);

text(
  "hel_lib_walk",
  "Dere går sammen i stillhet, ut av det som en gang var helvetesverdenen, og hver skritt kjennes lettere enn den forrige. Til slutt, ved kanten av det hele, stanser dere begge, usikre på hva som venter videre."
);
choice("hel_lib_walk", [{ text: "Bryt stillheten og spør hva som skjer nå", next: "hel_lib_crossing" }]);

text(
  "hel_lib_crossing",
  "«Jeg vet ikke om jeg hører hjemme noe sted lenger,» sier den frigjorte, stille. «Det er lenge siden jeg var noe annet enn fanget.» Foran dere ligger sprekken tilbake til den vanlige verden, fortsatt åpen, fortsatt flimrende svakt."
);
choice("hel_lib_crossing", [
  { text: "Tilby å bli med den frigjorte videre, som følgesvenner", next: "hel_lib_together_end" },
  { text: "Foreslå å forsegle sprekken for godt, så ingen andre blir fanget slik", next: "hel_lib_seal_choice" },
]);

newScenes["hel_lib_together_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Dere går gjennom sammen, inn i en verden den frigjorte knapt husker og du selv aldri helt så på samme måte igjen. Det blir ikke enkelt - ingenting med å bygge et nytt liv fra bunnen er det - men dere gjør det sammen, og det er mer enn noen av dere hadde for bare noen timer siden.",
  image: ordinaryScene(970, "walk"),
} as Scene;

text(
  "hel_lib_seal_choice",
  "Den frigjorte nikker langsomt til forslaget ditt, med et blikk av både lettelse og sorg. «Da blir det ingen flere som meg,» sier den. «Det er kanskje det beste jeg kan gjøre for noen jeg aldri fikk møte.»"
);
choice("hel_lib_seal_choice", [
  { text: "Forsegl sprekken sammen, en gang for alle", next: "hel_lib_sealed_end" },
  { text: "Nøl - er dere sikre på at ingen andre trenger en vei ut?", next: "hel_lib_bridge_end" },
]);

newScenes["hel_lib_sealed_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Sammen legger dere hendene mot sprekken, og den lukker seg for godt med en lyd som nesten ligner et sukk av lettelse. Ingen flere vil noensinne bli lurt eller fanget denne veien. Dere går videre, hver til deres eget liv, forandret, men fri - og aldri helt alene med minnet om det som skjedde.",
  image: ordinaryScene(971, "gone"),
} as Scene;

newScenes["hel_lib_bridge_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Dere lar sprekken stå, bare litt på gløtt - en nødutgang for enhver annen som en dag måtte trenge en vei ut slik dere selv gjorde. Det er en risiko, det vet dere begge. Men noen ganger er en åpen dør, selv en farlig en, bedre enn en vegg ingen kan banke på.",
  image: ordinaryScene(972, "house"),
} as Scene;

// === Chain 4 (MEDIUM, ~depth 8 -> ~11): hel_sacrifice_end - watching from the stone ===

convertEndings["hel_sacrifice_end"] = {
  interaction: "choice",
  choices: [{ text: "La steinen omslutte deg, og se hva som skjer med bevisstheten din", next: "hel_sac_settle" }],
};

text(
  "hel_sac_settle",
  "Steinen lukker seg om deg, kald og tett, men du forsvinner ikke slik du fryktet du ville. I stedet blir du værende - en oppmerksomhet uten kropp, fanget i stein, men fortsatt i stand til å se og høre alt som skjer utenfor."
);
choice("hel_sac_settle", [{ text: "Se etter den du nettopp reddet", next: "hel_sac_watch" }]);

text(
  "hel_sac_watch",
  "Du ser den du reddet gå videre gjennom helvetesverdenen, fri, forvirret, men i live - takket være deg. Årene, om det er årene, går sakte forbi mens du ligger stille i steinen din, en observatør uten stemme."
);
choice("hel_sac_watch", [
  { text: "Prøv å finne en måte å nå ut til dem likevel", next: "hel_sac_reach" },
  { text: "Godta rollen som stille vokter i steinen", next: "hel_sac_still_end" },
]);

newScenes["hel_sac_still_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du gir slipp på tanken om å bli hørt, og finner i stedet en merkelig fred i å bare være til stede - en stille tilskuer til alt som skjer i denne underlige verdenen, uten byrden av å måtte gjøre noe med det. Det er ikke det livet du forestilte deg, men det er, på sin egen måte, fredfylt.",
  image: stoneVigilScene(980, "cold"),
} as Scene;

text(
  "hel_sac_reach",
  "Det tar det som føles som årevis av forsøk, men til slutt, en natt full av tvil, klarer du å presse en tanke gjennom steinen - ikke ord, bare en følelse, en varme, rett inn i drømmene til den du reddet."
);
choice("hel_sac_reach", [{ text: "Fortsett å nå ut, natt etter natt", next: "hel_sac_bond" }]);

newScenes["hel_sac_bond"] = {
  interaction: "conversation",
  text: "Den du reddet begynner å drømme om steinen, om en varm tilstedeværelse i mørket, uten helt å forstå hvorfor. En natt, i drømmen, snur de seg og snakker direkte til deg for første gang.",
  characterName: "Den du reddet",
  greeting: "«Er det deg?» spør stemmen i drømmen, nølende. «Jeg har drømt om denne varmen så lenge. Jeg trodde jeg fant på det.»",
  systemPrompt:
    "Du spiller Den du reddet - noen som over lang tid har kjent en vag, varm tilstedeværelse i drømmene sine uten å forstå at det er spilleren, fanget i stein, som prøver å nå ut. Du er forsiktig håpefull, litt redd for å tro på det som virker for godt til å være sant. Spilleren styrer den fangede bevisstheten i steinen.\n\nStill spilleren to spørsmål om hvem de er og hvorfor de er der, og la din egen tro eller tvil vokse basert på hvor tydelig og ærlig spilleren klarer å formidle det gjennom den vage drømme-forbindelsen.\n\nVurder helheten:\n- Klarer å formidle nok klarhet og varme til at forbindelsen føles ekte og trygg: sett 'success'.\n- Forbindelsen forblir for vag og utydelig, du gir opp å tro på den: sett 'failure'.\n- Noe uventet skjer - drømmeforbindelsen blir sterkere enn noen av dere forventet, nesten for sterk: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "hel_sac_dreambond_end" },
    failure: { next: "hel_sac_fade_end" },
    twist: { next: "hel_sac_merge_end" },
  },
  maxTurns: 8,
} as ConversationScene;

newScenes["hel_sac_dreambond_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Forbindelsen holder, natt etter natt, år etter år - en vennskap bygget helt og holdent i drømmer, mellom en stein og en fri sjel som aldri glemmer hvem som ga dem friheten. Det er ikke det livet noen av dere valgte, men det er ekte, og det er, på sitt eget rare vis, nok.",
  image: stoneVigilScene(981, "warm"),
} as Scene;

newScenes["hel_sac_fade_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Drømmeforbindelsen visner sakte, for vag og uklar til at den du reddet klarer å holde fast i den. Til slutt slutter de å drømme om varmen i det hele tatt, og lever videre uten å ane hvem som ga dem den andre sjansen. Du blir liggende igjen i steinen, alene med visshet om at det i det minste holdt en stund.",
  image: stoneVigilScene(982, "cold"),
} as Scene;

newScenes["hel_sac_merge_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Forbindelsen blir sterkere enn noen av dere ventet - så sterk at grensen mellom drøm og virkelighet, mellom deg i steinen og dem der ute, begynner å viskes ut på netter dere begge slutter å telle. Verken helt du, verken helt dem, men noe nytt, delt mellom en stein og en fri sjel som aldri visste hva de ba om.",
  image: stoneVigilScene(983, "warm"),
} as Scene;

// === Chain 5 (SHORT, ~depth 6 -> ~8): hel_reckless_wake_end - reality bending back ===

convertEndings["hel_reckless_wake_end"] = {
  interaction: "choice",
  choices: [
    { text: "Se på asken på skoene dine - beviset på at det var ekte", next: "hel_wake_evidence_end" },
    { text: "Fei asken bort og fortell deg selv at det var en drøm", next: "hel_wake_denial_end" },
  ],
};

newScenes["hel_wake_evidence_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du lar asken ligge, som et bevis du nekter å skylle vekk selv når morgenen blir til dag og dagen blir til uker. Ingen andre tror deg, selvsagt, men det spiller ingen rolle - du vet. Skoene står fortsatt i entreen, med den samme svarte asken, hver gang du sjekker.",
  image: mundaneRoomScene(990, false),
} as Scene;

newScenes["hel_wake_denial_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du feier asken bort, dusjer lenge, og går videre med dagen din som om ingenting skjedde. Det fungerer, for det meste - helt til enkelte netter, når det blir stille nok, og du kjenner en svak lukt av svovel du ikke klarer å forklare for noen, minst av alt deg selv.",
  image: mundaneRoomScene(991, true),
} as Scene;

// === Chain 6 (SHORT, ~depth 7 -> ~9): hel_probe_caught_end - what "care" costs ===

convertEndings["hel_probe_caught_end"] = {
  interaction: "choice",
  choices: [
    { text: "Prøv å vri deg løs likevel", next: "hel_caught_struggle_end" },
    { text: "Gi etter for grepet, utmattet", next: "hel_caught_yield_end" },
  ],
};

newScenes["hel_caught_struggle_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du vrir deg, sparker, kjemper med alt du har - men grepet strammer seg bare hardere, kaldt og umulig å rokke ved. «Sånn ja,» sier skikkelsen, nesten fornøyd. «Det er alltid mer interessant når dere kjemper imot.»",
  image: capturedScene(1000),
} as Scene;

newScenes["hel_caught_yield_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du gir etter, og grepet mykner et lite, forvirrende sekund - nesten som om det var det eneste den egentlig ønsket. «Der,» hvisker skikkelsen. «Var det så vanskelig?» Du blir stående der lenge etter at du skjønner at «omsorg» og «eierskap» kan høres nesten helt like ut, i riktig stemme.",
  image: capturedScene(1001),
} as Scene;

// ---------------------------------------------------------------------------

const patch: ExtensionPatch = { convertEndings, newScenes };
const storyPath = process.argv[2] ?? "src/story/example.json";
applyExtension(storyPath, patch);
