import {
  buildSpec,
  createGrid,
  fillRect,
  noiseDither,
  outlineRect,
  radialGlow,
  playerBack,
} from "./pixelArtHelpers.ts";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// small standing-animal silhouette with two eye dots, reused across cat/lion pieces
function bigCat(grid: number[][], x: number, y: number, bodyColor: number, edgeColor: number, eyeColor: number, scale = 1) {
  const s = (n: number) => Math.round(n * scale);
  outlineRect(grid, x, y + s(6), s(20), s(10), bodyColor, edgeColor); // body
  outlineRect(grid, x + s(2), y, s(12), s(9), bodyColor, edgeColor); // head
  fillRect(grid, x + s(1), y + s(2), s(3), s(4), bodyColor); // left ear
  fillRect(grid, x + s(10), y + s(2), s(3), s(4), bodyColor); // right ear
  fillRect(grid, x + s(5), y + s(3), s(2), s(2), eyeColor); // left eye
  fillRect(grid, x + s(9), y + s(3), s(2), s(2), eyeColor); // right eye
  outlineRect(grid, x - s(2), y + s(14), s(4), s(6), bodyColor, edgeColor); // front leg
  outlineRect(grid, x + s(16), y + s(14), s(4), s(6), bodyColor, edgeColor); // front leg
}

function vetHumanFigure(grid: number[][], x: number, y: number, coatColor: number, skinColor: number, scale = 1) {
  const s = (n: number) => Math.round(n * scale);
  fillRect(grid, x + s(2), y, s(4), s(4), skinColor); // head
  fillRect(grid, x, y + s(4), s(8), s(10), coatColor); // coat body
  fillRect(grid, x, y + s(4), s(8), s(1), skinColor === coatColor ? coatColor : coatColor); // collar (kept simple)
  fillRect(grid, x + s(1), y + s(14), s(2), s(6), coatColor); // leg
  fillRect(grid, x + s(5), y + s(14), s(2), s(6), coatColor); // leg
}

// --- 1. fork2_scene2_vet entry + burnout end: quiet clinic at night, phone ringing ---
function vetClinicNight128() {
  const palette = ["#0a1420", "#16283a", "#243c52", "#5a7a92", "#e8f0f5", "#2d4a3a", "#0e0e12", "#ffce7a", "#8fb8cc"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(201);

  fillRect(grid, 0, 92, 128, 36, 5); // dark lawn
  noiseDither(grid, 0, 92, 128, 36, 0, 0.15, mulberry32(202));
  fillRect(grid, 0, 92, 128, 2, 6);

  // clinic building, lit window
  outlineRect(grid, 20, 40, 88, 52, 2, 6);
  outlineRect(grid, 48, 56, 32, 24, 8, 4); // big lit window
  fillRect(grid, 52, 60, 24, 16, 8);
  noiseDither(grid, 52, 60, 24, 16, 4, 0.1, mulberry32(203));
  outlineRect(grid, 30, 78, 10, 14, 6, 4); // door
  fillRect(grid, 60, 30, 8, 10, 6); // little sign post
  fillRect(grid, 56, 26, 16, 6, 4);

  // distant tree line hinting at the old forest beyond the town
  const treeRng = mulberry32(204);
  for (let x = 0; x < 20; x += 4) {
    const h = 10 + Math.floor(treeRng() * 10);
    fillRect(grid, x, 92 - h, 4, h, 5);
  }
  for (let x = 108; x < 128; x += 4) {
    const h = 10 + Math.floor(treeRng() * 10);
    fillRect(grid, x, 92 - h, 4, h, 5);
  }

  const starRng = mulberry32(205);
  for (let i = 0; i < 14; i++) {
    grid[Math.floor(starRng() * 30)][Math.floor(starRng() * 128)] = 4;
  }

  const glow = [
    ...radialGlow(64, 68, 12, "flicker", "#ffce7a", mulberry32(206)),
    { x: 64, y: 30, animation: "pulse" as const, color: "#8fb8cc" },
    { x: 20, y: 12, animation: "sparkle" as const, color: "#e8f0f5" },
    { x: 104, y: 16, animation: "sparkle" as const, color: "#e8f0f5" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 2. for_vet_callout: wounded lynx at the forest edge, moonlight ---
function forestEdgeNight128() {
  const palette = ["#050a14", "#0e1a2c", "#1c3048", "#2a4a3a", "#4a6a4a", "#c9d6e8", "#7a5a3a", "#e8e0c8", "#3a5a6a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(211);

  fillRect(grid, 0, 96, 128, 32, 3); // dark ground
  noiseDither(grid, 0, 96, 128, 32, 4, 0.2, mulberry32(212));
  fillRect(grid, 0, 96, 128, 2, 6);

  [4, 20, 96, 112].forEach((x) => {
    const h = 40 + Math.floor(rng() * 24);
    outlineRect(grid, x, 96 - h, 10, h, 2, 1);
  });

  // moon
  outlineRect(grid, 96, 12, 14, 14, 7, 5);
  noiseDither(grid, 0, 0, 128, 40, 1, 0.03, mulberry32(213));

  // the lynx, hurt, low to the ground
  bigCat(grid, 48, 92, 6, 1, 8, 1.3);
  fillRect(grid, 66, 108, 8, 2, 8); // a faint blood-free bandage-like mark, kept abstract

  const glow = [
    ...radialGlow(103, 19, 10, "pulse", "#e8e0c8", mulberry32(214)),
    { x: 59, y: 95, animation: "flicker" as const, color: "#8fd9ff" },
    { x: 63, y: 95, animation: "flicker" as const, color: "#8fd9ff" },
    ...radialGlow(20, 40, 6, "sparkle", "#3a5a6a", mulberry32(215)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 3. for_vet_gentle / for_vet_sedate / for_vet_mundane_end: lynx close-up, forest backdrop ---
function lynxCloseUp128() {
  const palette = ["#0e1a14", "#1c3020", "#2a4a2e", "#4a6a44", "#c9d6c0", "#8a6a44", "#e8e0c8", "#f5e6a0", "#2c1a10"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(221);

  fillRect(grid, 0, 90, 128, 38, 2); // ground
  noiseDither(grid, 0, 90, 128, 38, 3, 0.2, mulberry32(222));
  [0, 18, 100, 116].forEach((x) => {
    const h = 36 + Math.floor(rng() * 20);
    fillRect(grid, x, 90 - h, 12, h, 1);
  });

  bigCat(grid, 40, 46, 5, 8, 7, 2.6);
  // tufted ears highlight
  fillRect(grid, 44, 40, 2, 4, 8);
  fillRect(grid, 76, 40, 2, 4, 8);

  const glow = [
    { x: 53, y: 58, animation: "pulse" as const, color: "#f5e6a0" },
    { x: 69, y: 58, animation: "pulse" as const, color: "#f5e6a0" },
    ...radialGlow(20, 20, 8, "sparkle", "#e8e0c8", mulberry32(223)),
    ...radialGlow(108, 24, 8, "sparkle", "#e8e0c8", mulberry32(224)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 4. for_vet_talk / for_vet_coerce_end: mystical lynx conversation, faint magic glow ---
function lynxSpiritTalk128() {
  const palette = ["#080614", "#161028", "#241c3c", "#3a2c5a", "#e8d8ff", "#5a4a7a", "#0c0818", "#ffd27f", "#7fe8ff"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(231);

  fillRect(grid, 0, 92, 128, 36, 5); // dim clinic floor / clearing
  noiseDither(grid, 0, 92, 128, 36, 6, 0.15, mulberry32(232));
  [2, 108, 118].forEach((x) => {
    const h = 30 + Math.floor(rng() * 20);
    fillRect(grid, x, 92 - h, 10, h, 2);
  });

  bigCat(grid, 46, 56, 3, 5, 8, 2.2);
  // faint spirit-light frame lines around it (drawn after the cat so they don't get overwritten)
  fillRect(grid, 42, 52, 48, 1, 5);
  fillRect(grid, 42, 93, 48, 1, 5);

  const glow = [
    ...radialGlow(70, 70, 20, "pulse", "#7fe8ff", mulberry32(233)),
    { x: 60, y: 66, animation: "pulse" as const, color: "#ffd27f" },
    { x: 76, y: 66, animation: "pulse" as const, color: "#ffd27f" },
    ...radialGlow(20, 24, 8, "sparkle", "#e8d8ff", mulberry32(234)),
    ...radialGlow(108, 20, 8, "sparkle", "#e8d8ff", mulberry32(235)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 5. for_vet_bond / for_vet_secret / for_vet_science_end / for_vet_letgo_end: healed lynx, dawn ---
function vetBondForest128() {
  const palette = ["#2a3a5a", "#f5c98a", "#4a7a4a", "#6fae52", "#8a6a44", "#e8e0c8", "#c9a06a", "#f0f0e0", "#7fbf5a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(241);

  fillRect(grid, 0, 40, 128, 50, 0); // dawn sky band
  noiseDither(grid, 0, 40, 128, 50, 1, 0.12, mulberry32(242));
  fillRect(grid, 0, 90, 128, 38, 3); // dawn grass
  noiseDither(grid, 0, 90, 128, 38, 8, 0.2, mulberry32(243));

  [0, 16, 104, 120].forEach((x) => {
    const h = 30 + Math.floor(rng() * 18);
    fillRect(grid, x, 90 - h, 12, h, 2);
  });

  vetHumanFigure(grid, 40, 68, 7, 5, 2.2);
  bigCat(grid, 66, 82, 4, 6, 7, 1.6);

  const glow = [
    ...radialGlow(20, 20, 14, "sparkle", "#f5c98a", mulberry32(244)),
    { x: 76, y: 92, animation: "flicker" as const, color: "#f0f0e0" },
    { x: 84, y: 92, animation: "flicker" as const, color: "#f0f0e0" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 6. fork2_scene2_econ / for_econ_numbers / for_econ_boss_dismiss: grey office ---
function officeGrey128() {
  const palette = ["#22262e", "#3a4050", "#535a6c", "#8890a0", "#c9ced8", "#2f6f8a", "#0f1116", "#d9dde4", "#4a5a3a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(251);

  fillRect(grid, 0, 0, 128, 128, 0); // wall
  // grid of cubicle partitions
  for (let x = 0; x < 128; x += 32) {
    outlineRect(grid, x, 70, 28, 40, 1, 2);
  }
  fillRect(grid, 0, 108, 128, 20, 6); // carpet strip
  noiseDither(grid, 0, 108, 128, 20, 2, 0.15, mulberry32(252));

  // ceiling strip lights
  for (let x = 4; x < 128; x += 24) {
    fillRect(grid, x, 4, 16, 3, 7);
  }

  // desk with monitor, foreground
  outlineRect(grid, 46, 84, 36, 18, 2, 1);
  outlineRect(grid, 54, 70, 20, 16, 4, 1);
  fillRect(grid, 56, 72, 16, 11, 5);

  playerBack(grid, 60, 92, 7, 2.5);

  const glow = [
    { x: 62, y: 78, animation: "pulse" as const, color: "#2f6f8a" },
    ...radialGlow(12, 12, 6, "flicker", "#d9dde4", mulberry32(253)),
    ...radialGlow(116, 12, 6, "flicker", "#d9dde4", mulberry32(254)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 7. for_econ_reveal / for_econ_ignore_end: desk documents, forest photo pinned ---
function officeDocuments128() {
  const palette = ["#1c2026", "#2f3440", "#4a5060", "#c9ced8", "#e8dca8", "#5a7a4a", "#0f1116", "#ff6f5a", "#7fbf5a"];
  const grid = createGrid(128, 128, 0);

  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 10, 30, 108, 66, 1, 2); // corkboard
  // pinned documents
  [
    [18, 38],
    [46, 42],
    [78, 36],
    [20, 66],
    [70, 68],
  ].forEach(([x, y]) => {
    outlineRect(grid, x, y, 22, 16, 3, 2);
    fillRect(grid, x + 2, y + 2, 16, 2, 4);
    fillRect(grid, x + 2, y + 6, 12, 2, 4);
  });
  // a small photo of the forest pond, pinned with a red thread connecting to a document
  outlineRect(grid, 92, 62, 20, 16, 6, 8);
  fillRect(grid, 96, 70, 10, 4, 5);
  fillRect(grid, 40, 46, 52, 1, 7); // red thread
  fillRect(grid, 40, 46, 1, 26, 7);
  fillRect(grid, 40, 72, 52, 1, 7);
  fillRect(grid, 91, 46, 1, 27, 7);

  const glow = [
    { x: 102, y: 70, animation: "sparkle" as const, color: "#7fbf5a" },
    ...radialGlow(64, 14, 8, "flicker", "#e8dca8", mulberry32(255)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 8. for_econ_dig: digging through files at night ---
function officeLateNight128() {
  const palette = ["#0a0c10", "#161a22", "#242a36", "#3a4256", "#e8dca8", "#5a7a4a", "#050608", "#ffd27f", "#2f6f8a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(261);

  fillRect(grid, 0, 0, 128, 128, 0);
  for (let x = 0; x < 128; x += 20) fillRect(grid, x, 0, 1, 128, 1); // dark window mullions
  outlineRect(grid, 30, 80, 68, 30, 2, 3);
  fillRect(grid, 34, 84, 60, 22, 1);
  noiseDither(grid, 34, 84, 60, 22, 3, 0.2, mulberry32(262));

  // stack of folders under a lamp
  outlineRect(grid, 46, 92, 16, 10, 5, 1);
  outlineRect(grid, 64, 90, 16, 12, 5, 1);
  fillRect(grid, 76, 60, 4, 26, 3); // lamp arm
  outlineRect(grid, 68, 52, 20, 10, 7, 3); // lamp shade

  playerBack(grid, 54, 104, 2, 2.4);

  const glow = [
    ...radialGlow(78, 58, 16, "flicker", "#ffd27f", mulberry32(263)),
    { x: 20, y: 20, animation: "sparkle" as const, color: "#2f6f8a" },
    { x: 108, y: 24, animation: "sparkle" as const, color: "#2f6f8a" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 9. for_econ_whistle_talk / for_econ_expose_end / for_econ_silenced_end: cafe meeting ---
function journalistMeeting128() {
  const palette = ["#1a1620", "#2c2436", "#463a56", "#8a7a9a", "#f0e6d8", "#c98a4a", "#0c0a10", "#7fe8ff", "#e8dca8"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(271);

  fillRect(grid, 0, 0, 128, 90, 0); // dim cafe interior
  fillRect(grid, 0, 90, 128, 38, 5); // floor
  noiseDither(grid, 0, 90, 128, 38, 1, 0.15, mulberry32(272));

  // window behind, city night glow
  outlineRect(grid, 12, 20, 40, 50, 2, 3);
  noiseDither(grid, 12, 20, 40, 50, 6, 0.08, mulberry32(273));

  // table between two figures
  outlineRect(grid, 50, 88, 36, 6, 6, 8);
  playerBack(grid, 40, 70, 4, 2.2);
  // journalist figure, facing player
  fillRect(grid, 92, 70, 6, 6, 4);
  fillRect(grid, 90, 76, 10, 14, 3);

  const glow = [
    ...radialGlow(96, 73, 6, "pulse", "#7fe8ff", mulberry32(274)),
    { x: 66, y: 90, animation: "flicker" as const, color: "#e8dca8" },
    ...radialGlow(20, 30, 8, "sparkle", "#f0e6d8", mulberry32(275)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 10. for_econ_ambition / for_econ_boardroom: boardroom presentation ---
function boardroomPresentation128() {
  const palette = ["#14161c", "#22262e", "#3a4050", "#8890a0", "#e8ecf2", "#2f6f8a", "#0a0b0e", "#ff6f5a", "#7fbf5a"];
  const grid = createGrid(128, 128, 0);

  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 20, 14, 88, 46, 2, 5); // big screen
  fillRect(grid, 24, 18, 80, 38, 5);
  // simple bar chart on screen
  [[30, 46, 8, 8], [42, 40, 8, 14], [54, 34, 8, 20], [66, 44, 8, 10], [78, 30, 8, 24]].forEach(([x, y, w, h]) =>
    fillRect(grid, x, y, w, h, 7)
  );

  // long table with silhouettes seated either side
  fillRect(grid, 16, 92, 96, 6, 1);
  [24, 40, 88, 104].forEach((x) => fillRect(grid, x, 78, 8, 14, 3));
  playerBack(grid, 60, 76, 7, 2.4); // presenter, back to us, facing the screen

  const glow = [
    ...radialGlow(64, 30, 10, "flicker", "#7fbf5a", mulberry32(281)),
    { x: 20, y: 12, animation: "sparkle" as const, color: "#e8ecf2" },
    { x: 108, y: 12, animation: "sparkle" as const, color: "#e8ecf2" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 11. for_econ_dream: reality-break, forest breaking through the boardroom floor ---
function dreamForestBasement128() {
  const palette = ["#0e0a1c", "#1e1638", "#3a2c5a", "#7a5aae", "#c9a6ff", "#2d4a22", "#6fae52", "#e8f5c8", "#fff2b0"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(291);

  fillRect(grid, 0, 0, 128, 128, 0);
  // fractured floor: office grey on top half, forest bleeding through cracks below
  fillRect(grid, 0, 0, 128, 60, 2);
  noiseDither(grid, 0, 0, 128, 60, 3, 0.08, mulberry32(292));
  fillRect(grid, 0, 60, 128, 68, 5); // forest floor breaking through
  noiseDither(grid, 0, 60, 128, 68, 6, 0.2, mulberry32(293));

  // jagged crack line where office meets forest
  const crack = [64, 60, 58, 66, 54, 62, 70, 58, 66];
  crack.forEach((cy, i) => fillRect(grid, i * 16, cy, 16, 2, 3));

  // trees growing up through where a conference table would be
  [8, 30, 96, 114].forEach((x) => {
    const h = 24 + Math.floor(rng() * 16);
    fillRect(grid, x, 60 - h, 6, h, 6);
    fillRect(grid, x - 4, 40 - Math.floor(h / 2), 14, 18, 7);
  });

  // ghostly meeting table fading into roots
  outlineRect(grid, 46, 30, 36, 10, 1, 4);
  playerBack(grid, 58, 24, 4, 2); // player mid-presentation, dissolving into the dream

  const glow = [
    ...radialGlow(64, 62, 22, "pulse", "#c9a6ff", mulberry32(294)),
    ...radialGlow(20, 90, 10, "sparkle", "#fff2b0", mulberry32(295)),
    ...radialGlow(108, 96, 10, "sparkle", "#fff2b0", mulberry32(296)),
    { x: 64, y: 20, animation: "flicker" as const, color: "#7a5aae" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 12. for_econ_success_hollow_end: cold office celebration ---
function hollowVictory128() {
  const palette = ["#181c22", "#262c36", "#3a4250", "#8890a0", "#e8ecf2", "#2f6f8a", "#0a0b0e", "#c9a6a6", "#5a6272"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(301);

  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 16, 20, 96, 60, 1, 5);
  fillRect(grid, 20, 24, 88, 52, 2);

  // scattered confetti, sparse and grey rather than festive
  for (let i = 0; i < 30; i++) {
    const x = 20 + Math.floor(rng() * 88);
    const y = 24 + Math.floor(rng() * 52);
    grid[y][x] = 7;
  }

  playerBack(grid, 58, 84, 4, 2.6); // alone in the empty room, back to us
  outlineRect(grid, 40, 96, 48, 4, 5, 8); // long empty table

  const glow = [
    ...radialGlow(64, 30, 8, "flicker", "#e8ecf2", mulberry32(302)),
    { x: 20, y: 90, animation: "sparkle" as const, color: "#5a6272" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 13. fork2_scene2_circus / for_circus_routine / for_circus_relapse_end / for_circus_fear_end: dark tent ---
function circusTentDark128() {
  const palette = ["#140a10", "#241226", "#3a1f2c", "#6a2f3a", "#e8c98a", "#8a2a2a", "#0a0508", "#ffb347", "#c9a6a6"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(311);

  // striped tent canopy
  for (let x = 0; x < 128; x += 16) {
    fillRect(grid, x, 0, 8, 70, 2);
    fillRect(grid, x + 8, 0, 8, 70, 3);
  }
  fillRect(grid, 0, 70, 128, 58, 5); // sawdust ring floor
  noiseDither(grid, 0, 70, 128, 58, 4, 0.2, mulberry32(312));
  outlineRect(grid, 24, 80, 80, 34, 5, 6); // ring border

  // spotlight cone
  fillRect(grid, 54, 0, 20, 90, 4);
  noiseDither(grid, 54, 0, 20, 90, 7, 0.06, mulberry32(313));

  playerBack(grid, 58, 92, 6, 2.6); // ringmaster, whip-hand implied by pose only
  fillRect(grid, 76, 98, 14, 1, 6); // whip line, abstract, non-graphic

  const glow = [
    ...radialGlow(64, 30, 14, "flicker", "#ffb347", mulberry32(314)),
    { x: 20, y: 96, animation: "pulse" as const, color: "#e8c98a" },
    { x: 108, y: 96, animation: "pulse" as const, color: "#e8c98a" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 14. for_circus_doubt / for_circus_harsh: lion eyes behind bars ---
function circusLionEyes128() {
  const palette = ["#0e0a0c", "#1e1214", "#3a1f20", "#5a2f2a", "#c9a06a", "#8a4a2a", "#0a0508", "#ffce7a", "#e8e0c8"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(321);

  fillRect(grid, 0, 0, 128, 128, 0);
  fillRect(grid, 0, 90, 128, 38, 2);
  noiseDither(grid, 0, 90, 128, 38, 3, 0.2, mulberry32(322));

  bigCat(grid, 40, 56, 5, 4, 7, 2.4);

  // cage bars over the whole scene
  for (let x = 6; x < 128; x += 14) {
    fillRect(grid, x, 10, 3, 100, 1);
  }
  fillRect(grid, 0, 10, 128, 3, 1);
  fillRect(grid, 0, 106, 128, 3, 1);

  const glow = [
    { x: 55, y: 66, animation: "pulse" as const, color: "#ffce7a" },
    { x: 71, y: 66, animation: "pulse" as const, color: "#ffce7a" },
    ...radialGlow(20, 20, 8, "sparkle", "#e8e0c8", mulberry32(323)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 15. for_circus_fire_save: tent fire, animals fleeing ---
function circusFire128() {
  const palette = ["#100608", "#241010", "#4a1a10", "#8a2a0a", "#ff5a2a", "#1a0c0c", "#0a0405", "#ffce7a", "#c9a06a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(331);

  fillRect(grid, 0, 0, 128, 128, 5); // smoke-dark canopy
  noiseDither(grid, 0, 0, 128, 60, 0, 0.1, mulberry32(332));
  fillRect(grid, 0, 90, 128, 38, 6);

  // flames climbing a tent pole
  fillRect(grid, 96, 20, 8, 70, 3);
  noiseDither(grid, 90, 10, 20, 70, 4, 0.35, mulberry32(333));
  fillRect(grid, 92, 8, 16, 10, 4);

  // fleeing animal silhouettes, running left toward the exit
  [[10, 96], [32, 100], [56, 98]].forEach(([x, y]) => {
    outlineRect(grid, x, y, 16, 10, 8, 1);
  });

  playerBack(grid, 66, 92, 8, 2.6); // player running toward the animals, not the cash box

  const glow = [
    ...radialGlow(100, 30, 22, "flicker", "#ff5a2a", mulberry32(334)),
    ...radialGlow(100, 70, 14, "flicker", "#ffce7a", mulberry32(335)),
    { x: 20, y: 100, animation: "sparkle" as const, color: "#c9a06a" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 16. for_circus_fire_greed_end: cash box saved, animals lost in smoke, cold regret ---
function circusFireGreed128() {
  const palette = ["#0a0608", "#1a0e10", "#3a1a16", "#6a2a10", "#ff8a3a", "#241414", "#050304", "#c9a06a", "#5a4a4a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(341);

  fillRect(grid, 0, 0, 128, 128, 5); // thick smoke fills the frame
  noiseDither(grid, 0, 0, 128, 128, 0, 0.2, mulberry32(342));
  fillRect(grid, 0, 96, 128, 32, 6);

  outlineRect(grid, 50, 90, 24, 16, 7, 4); // the cash box, clutched close
  playerBack(grid, 54, 76, 4, 2.2);

  const emberRng = mulberry32(343);
  const glow = [];
  for (let i = 0; i < 16; i++) {
    glow.push({
      x: Math.floor(emberRng() * 128),
      y: 20 + Math.floor(emberRng() * 60),
      animation: "flicker" as const,
      color: "#ff8a3a",
    });
  }
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 17. for_circus_lion_talk: mystical lion conversation ---
function lionSpiritTalk128() {
  const palette = ["#0a0614", "#181028", "#2c1e40", "#4a3560", "#e8d8ff", "#6a5090", "#0c0810", "#ffce7a", "#7fe8ff"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(351);

  fillRect(grid, 0, 92, 128, 36, 5);
  noiseDither(grid, 0, 92, 128, 36, 6, 0.15, mulberry32(352));

  bigCat(grid, 44, 50, 3, 5, 8, 2.4);
  fillRect(grid, 42, 51, 52, 1, 5);
  fillRect(grid, 42, 95, 52, 1, 5);

  const glow = [
    ...radialGlow(68, 68, 20, "pulse", "#7fe8ff", mulberry32(353)),
    { x: 58, y: 62, animation: "pulse" as const, color: "#ffce7a" },
    { x: 74, y: 62, animation: "pulse" as const, color: "#ffce7a" },
    ...radialGlow(20, 24, 8, "sparkle", "#e8d8ff", mulberry32(354)),
    ...radialGlow(108, 20, 8, "sparkle", "#e8d8ff", mulberry32(355)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 18. for_circus_redeem / for_circus_reform: dawn circus, calmer, open cage ---
function circusReform128() {
  const palette = ["#2a3a5a", "#f5c98a", "#6a4a3a", "#c9a06a", "#8a6a44", "#e8e0c8", "#4a7a4a", "#f0f0e0", "#7fbf5a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(361);

  fillRect(grid, 0, 30, 128, 60, 0); // dawn sky
  noiseDither(grid, 0, 30, 128, 60, 1, 0.1, mulberry32(362));
  fillRect(grid, 0, 90, 128, 38, 3);
  noiseDither(grid, 0, 90, 128, 38, 6, 0.15, mulberry32(363));

  // open cage, door swung wide
  outlineRect(grid, 20, 60, 28, 34, 5, 2);
  fillRect(grid, 20, 60, 2, 34, 2);
  fillRect(grid, 20, 60, 20, 2, 2); // door hanging open, angled implied by gap

  bigCat(grid, 60, 78, 4, 6, 7, 1.7); // lion calm, out in the open

  const glow = [
    ...radialGlow(20, 18, 14, "sparkle", "#f5c98a", mulberry32(364)),
    { x: 70, y: 88, animation: "flicker" as const, color: "#f0f0e0" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 19. for_reunion_vet / for_reunion_econ / for_reunion_circus: forest threatened, survey stakes ---
function forestThreatened128() {
  const palette = ["#bfe6ff", "#e8dca8", "#2d4a22", "#6fae52", "#4a3221", "#7fbf5a", "#8a8a8a", "#ff6f5a", "#5a5a5a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(371);

  fillRect(grid, 0, 88, 128, 40, 5);
  noiseDither(grid, 0, 88, 128, 40, 3, 0.2, mulberry32(372));
  fillRect(grid, 0, 88, 128, 2, 2);

  const treeCols = [4, 20, 96, 112];
  treeCols.forEach((x) => {
    const trunkH = 16 + Math.floor(rng() * 8);
    outlineRect(grid, x + 4, 88 - trunkH, 6, trunkH, 4, 8);
    const foliageH = 30 + Math.floor(rng() * 14);
    fillRect(grid, x, 88 - trunkH - foliageH + 8, 16, foliageH, 2);
  });

  // survey stakes with orange flagging tape, cutting into the clearing
  [[44, 96], [58, 100], [72, 94], [84, 102]].forEach(([x, y]) => {
    fillRect(grid, x, y, 2, 14, 6);
    fillRect(grid, x - 2, y, 6, 2, 7);
  });
  // distant silhouette of heavy machinery beyond the tree line
  outlineRect(grid, 4, 68, 20, 14, 8, 6);
  fillRect(grid, 8, 62, 4, 8, 8);

  const glow = [
    ...radialGlow(92, 16, 10, "sparkle", "#e8dca8", mulberry32(373)),
    { x: 44, y: 96, animation: "flicker" as const, color: "#ff6f5a" },
    { x: 84, y: 102, animation: "flicker" as const, color: "#ff6f5a" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 20. for_reunion_meet: weathered pond, Frosken again, stakes nearby ---
function reunionPondMeeting128() {
  const palette = ["#bfe6ff", "#e8dca8", "#2d4a22", "#4a7a3a", "#4a3221", "#5f8a2a", "#3f7a86", "#8fae3a", "#e8f5c8", "#ff6f5a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(381);

  fillRect(grid, 0, 88, 128, 40, 5);
  noiseDither(grid, 0, 88, 128, 40, 3, 0.15, mulberry32(382));

  const treeCols = [0, 14, 108, 118];
  treeCols.forEach((x) => {
    const trunkH = 16 + Math.floor(rng() * 8);
    fillRect(grid, x + 4, 88 - trunkH, 6, trunkH, 4);
    const foliageH = 28 + Math.floor(rng() * 12);
    fillRect(grid, x, 88 - trunkH - foliageH + 8, 16, foliageH, 2);
  });

  outlineRect(grid, 30, 100, 60, 20, 6, 3);
  noiseDither(grid, 30, 100, 60, 20, 3, 0.1, mulberry32(383));
  fillRect(grid, 42, 102, 8, 3, 8);

  // Frosken, older but unmistakable, by the water's edge
  outlineRect(grid, 42, 92, 36, 12, 7, 8);
  outlineRect(grid, 48, 80, 26, 16, 7, 8);
  outlineRect(grid, 52, 74, 8, 8, 7, 8);
  outlineRect(grid, 70, 74, 8, 8, 7, 8);
  fillRect(grid, 55, 77, 3, 3, 8);
  fillRect(grid, 73, 77, 3, 3, 8);

  // survey stake at the pond's edge, tape fluttering
  fillRect(grid, 98, 90, 2, 12, 4);
  fillRect(grid, 96, 90, 6, 2, 9);

  const glow = [
    { x: 56, y: 78, animation: "sparkle" as const, color: "#e8f5c8" },
    { x: 74, y: 78, animation: "sparkle" as const, color: "#e8f5c8" },
    ...radialGlow(92, 18, 10, "sparkle", "#e8dca8", mulberry32(384)),
    { x: 99, y: 90, animation: "flicker" as const, color: "#ff6f5a" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 21. for_reunion_fight / for_reunion_victory_end: dawn defenders, hopeful ---
function reunionFight128() {
  const palette = ["#f5c98a", "#bfe6ff", "#2d4a22", "#6fae52", "#4a3221", "#7fbf5a", "#e8f5c8", "#8fae3a", "#ffe8b0"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(391);

  fillRect(grid, 0, 20, 128, 68, 1); // dawn sky
  noiseDither(grid, 0, 20, 128, 68, 8, 0.08, mulberry32(392));
  fillRect(grid, 0, 88, 128, 40, 5);
  noiseDither(grid, 0, 88, 128, 40, 7, 0.2, mulberry32(393));

  [4, 18, 106, 120].forEach((x) => {
    const h = 30 + Math.floor(rng() * 16);
    fillRect(grid, x, 88 - h, 12, h, 2);
  });

  // a line of people standing together at the forest edge, arms linked in spirit
  [30, 44, 58, 72, 86].forEach((x) => {
    fillRect(grid, x, 78, 6, 12, 4);
    fillRect(grid, x + 1, 74, 4, 4, 4);
  });

  const glow = [
    ...radialGlow(20, 28, 16, "sparkle", "#ffe8b0", mulberry32(394)),
    { x: 108, y: 32, animation: "sparkle" as const, color: "#ffe8b0" },
    ...radialGlow(58, 40, 10, "sparkle", "#e8f5c8", mulberry32(395)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 22. for_reunion_lost_end / for_reunion_partial_end: bulldozed clearing, stumps ---
function reunionLost128() {
  const palette = ["#8a9aa8", "#c9d4dc", "#4a3a2c", "#6a5a44", "#2d4a22", "#5a4a3a", "#3a3a3a", "#e8e0c8", "#7fbf5a"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(401);

  fillRect(grid, 0, 30, 128, 58, 1); // pale overcast sky
  noiseDither(grid, 0, 30, 128, 58, 0, 0.1, mulberry32(402));
  fillRect(grid, 0, 88, 128, 40, 5); // churned earth
  noiseDither(grid, 0, 88, 128, 40, 3, 0.25, mulberry32(403));

  // a few remaining trees at the far edges, most of the middle cleared to stumps
  [0, 14, 112, 126].forEach((x) => {
    const h = 26 + Math.floor(rng() * 14);
    fillRect(grid, x, 88 - h, 10, h, 2);
  });
  const stumpRng = mulberry32(404);
  for (let i = 0; i < 10; i++) {
    const x = 20 + Math.floor(stumpRng() * 84);
    const y = 90 + Math.floor(stumpRng() * 20);
    outlineRect(grid, x, y, 8, 5, 5, 6);
  }
  // one small green shoot surviving among the stumps, a thread of hope
  fillRect(grid, 64, 92, 2, 6, 8);
  fillRect(grid, 62, 90, 6, 3, 8);

  const glow = [
    { x: 65, y: 90, animation: "sparkle" as const, color: "#7fbf5a" },
    ...radialGlow(20, 36, 6, "sparkle", "#e8e0c8", mulberry32(405)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 23. for_reunion_manyyou_end: mystical reflection of many silhouettes in the pond ---
function reunionManyYou128() {
  const palette = ["#0a1020", "#16243a", "#2a4258", "#3f7a86", "#e8f5c8", "#7fe8ff", "#0c0814", "#c9a6ff", "#fff2b0"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(411);

  fillRect(grid, 0, 0, 128, 70, 0); // night sky over the pond
  noiseDither(grid, 0, 0, 128, 70, 1, 0.05, mulberry32(412));
  const starRng = mulberry32(413);
  for (let i = 0; i < 16; i++) {
    grid[Math.floor(starRng() * 60)][Math.floor(starRng() * 128)] = 8;
  }

  outlineRect(grid, 0, 70, 128, 58, 3, 2); // still water, edge to edge
  noiseDither(grid, 0, 70, 128, 58, 2, 0.1, mulberry32(414));

  // one standing figure at the water's edge
  fillRect(grid, 60, 50, 8, 20, 6);
  // its many reflections in the water, each subtly different in stance - other lives
  [20, 36, 52, 68, 84, 100].forEach((x, i) => {
    const lean = i % 2 === 0 ? 0 : 2;
    fillRect(grid, x + lean, 76, 6, 16, 5);
  });

  const glow = [
    ...radialGlow(64, 60, 16, "pulse", "#c9a6ff", mulberry32(415)),
    { x: 20, y: 80, animation: "flicker" as const, color: "#fff2b0" },
    { x: 100, y: 80, animation: "flicker" as const, color: "#fff2b0" },
    { x: 60, y: 88, animation: "sparkle" as const, color: "#7fe8ff" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

const images = {
  vetClinicNight128: vetClinicNight128(),
  forestEdgeNight128: forestEdgeNight128(),
  lynxCloseUp128: lynxCloseUp128(),
  lynxSpiritTalk128: lynxSpiritTalk128(),
  vetBondForest128: vetBondForest128(),
  officeGrey128: officeGrey128(),
  officeDocuments128: officeDocuments128(),
  officeLateNight128: officeLateNight128(),
  journalistMeeting128: journalistMeeting128(),
  boardroomPresentation128: boardroomPresentation128(),
  dreamForestBasement128: dreamForestBasement128(),
  hollowVictory128: hollowVictory128(),
  circusTentDark128: circusTentDark128(),
  circusLionEyes128: circusLionEyes128(),
  circusFire128: circusFire128(),
  circusFireGreed128: circusFireGreed128(),
  lionSpiritTalk128: lionSpiritTalk128(),
  circusReform128: circusReform128(),
  forestThreatened128: forestThreatened128(),
  reunionPondMeeting128: reunionPondMeeting128(),
  reunionFight128: reunionFight128(),
  reunionLost128: reunionLost128(),
  reunionManyYou128: reunionManyYou128(),
};
console.log(JSON.stringify(images));
