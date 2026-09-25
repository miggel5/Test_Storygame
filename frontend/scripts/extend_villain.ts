import type { ConversationScene, Scene } from "../src/types/story.ts";
import { applyExtension, type ExtensionPatch } from "./applyExtension.ts";
import { buildSpec, createGrid, fillRect, noiseDither, outlineRect, playerBack, radialGlow } from "./pixelArtHelpers.ts";

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

const UNDERCITY_PALETTE = ["#0a0a12", "#161622", "#2a2a3a", "#4a4a62", "#c9c9d8", "#8a2a2a", "#050508", "#ff6f5a", "#5a3a8a"];
const PRISON_PALETTE = ["#0c0c0e", "#1a1a1e", "#2e2e34", "#5a5a62", "#c9c9ce", "#2f6f8a", "#060606", "#ff9a3a", "#7a7a82"];
const HEIST_PALETTE = ["#08060e", "#161028", "#2a2044", "#5a4a7a", "#e8d8ff", "#c9a04a", "#0a0810", "#7fe8ff", "#ff6f5a"];
const STREET_PALETTE = ["#0a0e16", "#161e2a", "#2a3a4a", "#4a6a7a", "#c9d8e0", "#8a2a2a", "#080a0e", "#ffb347", "#5a8a9a"];

function jailBarsQuick(grid: Grid, x: number, y: number, w: number, h: number, colorIndex: number, count = 6) {
  const gap = w / count;
  for (let i = 0; i < count; i++) {
    fillRect(grid, Math.round(x + i * gap), y, 2, h, colorIndex);
  }
}

function undercityScene(seed: number, tense: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  const rng = mulberry32(seed);
  for (let i = 0; i < 40; i++) grid[Math.floor(rng() * 60)][Math.floor(rng() * 128)] = 8;
  outlineRect(grid, 10, 60, 108, 50, 3, tense ? 5 : 4);
  noiseDither(grid, 10, 60, 108, 50, tense ? 5 : 3, 0.14, mulberry32(seed + 1));
  playerBack(grid, 40, 92, 5, 3.6);
  playerBack(grid, 70, 92, 4, 3.2);
  const glow = [...radialGlow(64, 90, 14, tense ? "flicker" : "pulse", tense ? "#ff6f5a" : "#5a3a8a", mulberry32(seed + 2))];
  return buildSpec(128, 128, UNDERCITY_PALETTE, grid, glow);
}

function prisonScene(seed: number, free: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 20, 30, 88, 80, free ? 5 : 3, free ? 8 : 2);
  noiseDither(grid, 20, 30, 88, 80, 6, 0.08, mulberry32(seed));
  if (!free) jailBarsQuick(grid, 28, 40, 72, 60, 2, 7);
  playerBack(grid, 58, 90, 5, 3.4);
  const glow = [...radialGlow(64, 60, free ? 18 : 8, free ? "sparkle" : "flicker", free ? "#7fe8ff" : "#ff9a3a", mulberry32(seed + 1))];
  return buildSpec(128, 128, PRISON_PALETTE, grid, glow);
}

function heistScene(seed: number, mood: "planning" | "action" | "aftermath") {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 14, 24, 100, 84, 3, mood === "action" ? 5 : 2);
  noiseDither(grid, 14, 24, 100, 84, mood === "action" ? 8 : 4, 0.12, mulberry32(seed));
  fillRect(grid, 46, 60, 36, 26, 6); // the vault / prize crate
  outlineRect(grid, 46, 60, 36, 26, 0, 5);
  playerBack(grid, 30, 92, 5, 3.4);
  playerBack(grid, 92, 92, 4, 3.2);
  const glow = [
    ...radialGlow(64, 60, mood === "action" ? 20 : 12, mood === "action" ? "flicker" : "sparkle", mood === "aftermath" ? "#7fe8ff" : "#ffb347", mulberry32(seed + 1)),
  ];
  return buildSpec(128, 128, HEIST_PALETTE, grid, glow);
}

function streetScene(seed: number, crowded: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 60, 0);
  fillRect(grid, 0, 60, 128, 68, 2);
  noiseDither(grid, 0, 60, 128, 68, 3, crowded ? 0.2 : 0.08, mulberry32(seed));
  [16, 44, 98].forEach((x) => outlineRect(grid, x, 30, 20, 32, 3, 5));
  playerBack(grid, 62, 92, 6, 3.6);
  if (crowded) {
    playerBack(grid, 30, 96, 4, 2.8);
    playerBack(grid, 90, 96, 4, 2.8);
  }
  const glow = [...radialGlow(64, 30, 14, "flicker", "#ffb347", mulberry32(seed + 1))];
  return buildSpec(128, 128, STREET_PALETTE, grid, glow);
}

// ---------------------------------------------------------------------------

const convertEndings: ExtensionPatch["convertEndings"] = {};
const newScenes: ExtensionPatch["newScenes"] = {};
const choiceTexts: Record<string, string> = {};
function text(id: string, t: string) {
  choiceTexts[id] = t;
}
function choice(id: string, choices: { text: string; next: string }[], image?: Scene["image"]) {
  newScenes[id] = { interaction: "choice", text: choiceTexts[id], image, choices } as Scene;
}

// === Chain 1 (SHORT, d5 -> ~7): vil_fear_lone_wolf_ending ===
convertEndings["vil_fear_lone_wolf_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bygg opp ryktet ditt videre, alene", next: "vil_lonewolf_build_end" },
    { text: "Forsvinn helt fra radaren - la ryktet dø ut", next: "vil_lonewolf_vanish_end" },
  ],
};
newScenes["vil_lonewolf_build_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du bygger videre på ryktet alene, en skygge ingen helt kan plassere et ansikt på. Det blir et ensomt liv, men ett du selv har kontroll over hver eneste dag av - og for deg er det verdt prisen.",
  image: streetScene(1300, false),
} as Scene;
newScenes["vil_lonewolf_vanish_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du lar ryktet dø sakte ut, flytter deg fra havn til havn til navnet ditt ikke betyr noe for noen lenger. Det er en underlig fred i å bli glemt frivillig, etter et liv der du nesten ble noe langt større.",
  image: streetScene(1301, false),
} as Scene;

// === Chain 2 (SHORT, d6 -> ~8): vil_prison_isolation_ending ===
convertEndings["vil_prison_isolation_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bruk isolasjonen til å planlegge neste trekk i stillhet", next: "vil_isolation_plan_end" },
    { text: "La isolasjonen knekke deg litt, for en stund", next: "vil_isolation_break_end" },
  ],
};
newScenes["vil_isolation_plan_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Isolasjonscellen blir, mot alle odds, et sted du tenker klarere enn på lenge. Du kommer ut måneder senere roligere, skarpere, og langt farligere for de som trodde de kunne kneble deg med stillhet alene.",
  image: prisonScene(1310, false),
} as Scene;
newScenes["vil_isolation_break_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Stillheten gjør det den er ment å gjøre, sakte og metodisk. Du kommer ut av isolasjonen en annen, mykere versjon av deg selv - ikke reformert, akkurat, men avvæpnet på en måte som varer lenger enn du liker å innrømme.",
  image: prisonScene(1311, false),
} as Scene;

// === Chain 3 (SHORT, d6 -> ~8): vil_infil_report_ending ===
convertEndings["vil_infil_report_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Følg opp rapporten med et formelt vitnemål", next: "vil_infil_report_testify_end" },
    { text: "La rapporten stå for seg selv, og gå videre til neste oppdrag", next: "vil_infil_report_move_end" },
  ],
};
newScenes["vil_infil_report_testify_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Vitnemålet ditt gir rapporten mer tyngde enn du forventet, og saken ender med faktiske konsekvenser for de involverte. Det er ikke den dramatiske historien du kanskje drømte om som ny rekrutt, men den er ekte, og den betyr noe.",
  image: streetScene(1320, false),
} as Scene;
newScenes["vil_infil_report_move_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du går videre til neste oppdrag uten å se tilbake, og lar rapporten din bli en av mange i en bunke andre håndterer. Karrieren din fortsetter, solid og upåklagelig, men uten den ene, minneverdige seieren du kunne fått ved å stå på litt lenger.",
  image: streetScene(1321, false),
} as Scene;

// === Chain 4 (MEDIUM, d7 -> ~13): vil_prison_recruited_ending ===
convertEndings["vil_prison_recruited_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bruk posisjonen din blant de innsatte til å bygge reell makt", next: "vil_recruited_power" },
    { text: "Bruk den i stedet til å beskytte de svakeste på innsiden", next: "vil_recruited_protect" },
  ],
};
text(
  "vil_recruited_power",
  "Du bygger sakte et nettverk av lojalitet og frykt blant de innsatte, til du i praksis styrer mer av fengselets indre liv enn vaktene selv later til å ane."
);
choice("vil_recruited_power", [{ text: "Konsolider makten videre", next: "vil_recruited_kingpin" }]);
newScenes["vil_recruited_kingpin"] = {
  interaction: "conversation",
  text: "En vakt du aldri har snakket med før søker deg opp en kveld, med et tilbud som overrasker deg.",
  characterName: "Vakten Torres",
  greeting: "«Du styrer mer her inne enn ledelsen vil innrømme,» sier Torres, lavt. «Jeg kan se det på begge sider - enten knuser vi det, eller så bruker vi det. Hva sier du til det siste?»",
  systemPrompt:
    "Du spiller Vakten Torres - pragmatisk, korrupsjonsvillig, ser en mulighet til å bruke spillerens makt blant de innsatte til egen vinning. Still spilleren to spørsmål om hvor langt de er villige til å gå i et slikt samarbeid med systemet de egentlig skulle stå imot. Vurder hvor prinsippfast eller kynisk spilleren fremstår.\n\nVurder helheten:\n- Avviser samarbeidet, prioriterer de innsattes tillit fremfor egen fordel: sett 'success'.\n- Godtar samarbeidet fullt ut, kynisk og maktsøkende: sett 'failure'.\n- Later til å godta, men med en skjult agenda Torres ikke aner: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "vil_recruited_refuse_end" },
    failure: { next: "vil_recruited_corrupt_end" },
    twist: { next: "vil_recruited_double_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["vil_recruited_refuse_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du avviser tilbudet, og velger i stedet å bruke innflytelsen din til å holde de innsatte samlet mot systemet, ikke i lomme med det. Det gjør deg til en farligere fange enn noensinne i Torres' øyne - og en helt i manges andres.",
  image: prisonScene(1330, false),
} as Scene;
newScenes["vil_recruited_corrupt_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du tar imot avtalen, og de neste årene blir et stille, korrupt samarbeid som gjør deg rikere og tryggere innenfor murene - på bekostning av nesten alt du en gang fortalte deg selv at du sto for.",
  image: prisonScene(1331, false),
} as Scene;
newScenes["vil_recruited_double_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du lar Torres tro han har kjøpt deg, mens du i det stille bruker avtalen til å samle informasjon om nettopp den korrupsjonen han representerer. Når det hele til slutt sprekker, er det ikke du som går ned med det.",
  image: prisonScene(1332, true),
} as Scene;
text(
  "vil_recruited_protect",
  "Du bruker respekten du har opparbeidet til å skjerme de svakeste innsatte fra utnyttelse - en rolle ingen ba deg om, men som passer bedre enn du forventet."
);
choice("vil_recruited_protect", [{ text: "Fortsett rollen som beskytter", next: "vil_recruited_protector_end" }]);
newScenes["vil_recruited_protector_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Årene innenfor blir tyngre for kroppen, men lettere for samvittigheten enn du forventet - kjent blant de innsatte ikke som en fryktet skurk, men som noen som faktisk holdt ord om å se etter de andre. Det er ikke den frihetshistorien du en gang drømte om, men den er din, og den er god.",
  image: prisonScene(1333, false),
} as Scene;

// === Chain 5 (MEDIUM, d7 -> ~13): vil_infil_doubleagent_ending ===
convertEndings["vil_infil_doubleagent_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Spill begge sider så lenge som mulig", next: "vil_double_play" },
    { text: "Velg en side før det blir for farlig å vente", next: "vil_double_choose" },
  ],
};
text(
  "vil_double_play",
  "Du balanserer på en stadig tynnere line mellom Reyes og crewet i ukene som følger, gjeve informasjon til begge parter i doser små nok til aldri helt å avsløre deg."
);
choice("vil_double_play", [{ text: "Fortsett balansegangen enda en uke", next: "vil_double_tension" }]);
newScenes["vil_double_tension"] = {
  interaction: "conversation",
  text: "Til slutt merker Reyes at noe ikke stemmer, og kaller deg inn til et møte som føles langt farligere enn de forrige.",
  characterName: "Kommandør Reyes",
  greeting: "«Informasjonen din har vært påfallende jevn i det siste,» sier Reyes, kaldt. «Jevn nok til at jeg lurer på om du egentlig jobber for meg i det hele tatt. Overbevis meg om at jeg tar feil.»",
  systemPrompt:
    "Du spiller Kommandør Reyes igjen - nå mer mistenksom enn noensinne, balanserer mellom å tro på spilleren og å avsløre dem som dobbeltagent. Still spilleren to skarpe spørsmål ment å avdekke løgnen, og vurder hvor overbevisende spilleren klarer å holde masken.\n\nVurder helheten:\n- Overbevisende, konsistent, klarer å berolige mistanken: sett 'success'.\n- Selvmotsigende, avslører seg selv under press: sett 'failure'.\n- Snur mistanken tilbake mot Reyes selv på en overraskende måte: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "vil_double_maintained_end" },
    failure: { next: "vil_double_exposed_end" },
    twist: { next: "vil_double_turntables_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["vil_double_maintained_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du holder masken, akkurat, og Reyes lar mistanken gli forbi - for nå. Du fortsetter balansegangen mellom to verdener som begge tror de eier deg, klar over at det bare er et spørsmål om tid før en av dem finner ut sannheten.",
  image: streetScene(1340, true),
} as Scene;
newScenes["vil_double_exposed_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Sprekkene i historien din blir for tydelige, og Reyes' ansikt stivner idet hun forstår. Du blir ikke arrestert - det ville vært for enkelt - men blir kastet ut av begge verdener på en gang, uten side igjen å stole på deg.",
  image: streetScene(1341, true),
} as Scene;
newScenes["vil_double_turntables_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du snur mistanken tilbake mot Reyes med en skarphet som tydelig rokker ved henne, og for et øyeblikk er det hun, ikke du, som må forsvare seg. Du forlater møtet uten svar, men med en helt ny type makt over situasjonen du ikke hadde da du gikk inn.",
  image: streetScene(1342, false),
} as Scene;
text(
  "vil_double_choose",
  "Du bestemmer deg for å velge side før spillet blir for farlig, og innser at valget kommer an på hvem du egentlig stoler mest på - myndighetene som rekrutterte deg, eller crewet som stolte på deg uten å vite bedre."
);
choice("vil_double_choose", [
  { text: "Velg myndighetene, offisielt og fullt ut", next: "vil_double_official_end" },
  { text: "Velg crewet, og advar dem om alt", next: "vil_double_crew_end" },
]);
newScenes["vil_double_official_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du velger myndighetene til slutt, med en tyngde av skyldfølelse over crewet du forråder. Aksjonen som følger blir ren og effektiv. Karrieren din vokser. Samvittigheten din bærer prisen for det i årene som følger.",
  image: streetScene(1343, false),
} as Scene;
newScenes["vil_double_crew_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du advarer crewet i stedet, og bryter med det alt myndighetene trodde de hadde bygget deg opp til å være. Det er farligere enn noe annet valg du kunne gjort, men det føles, for første gang på lenge, som ditt eget.",
  image: streetScene(1344, true),
} as Scene;

// === Chain 6 (MEDIUM, d7 -> ~13): vil_infil_whistleblower_ending ===
convertEndings["vil_infil_whistleblower_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Følg opp saken gjennom rettssystemet, uansett hvor lang tid det tar", next: "vil_whistle_follow" },
    { text: "Forsvinn nå som saken er ute, og la andre ta det videre", next: "vil_whistle_disappear_end" },
  ],
};
newScenes["vil_whistle_disappear_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du forsvinner sporløst nå som sannheten er ute, og bygger deg et helt nytt liv et sted ingen av de gamle kontaktene dine noensinne finner deg. Rettssaken ruller videre uten deg. Du sover, for første gang på år, uten å lytte etter fottrinn.",
  image: streetScene(1350, false),
} as Scene;
text(
  "vil_whistle_follow",
  "Du blir, mot bedre vitende, og følger saken gjennom en lang, utmattende rettsprosess - vitnesbyrd etter vitnesbyrd, trusler som aldri blir noe av, men aldri helt forsvinner heller."
);
choice("vil_whistle_follow", [{ text: "Vitne i den avgjørende rettsdagen", next: "vil_whistle_testify" }]);
newScenes["vil_whistle_testify"] = {
  interaction: "conversation",
  text: "Forsvarsadvokaten til de tiltalte krysseksaminerer deg med en skarphet som er tydelig ment å knekke historien din i stykker foran hele rettssalen.",
  characterName: "Forsvarsadvokaten",
  greeting: "«Du forventer at retten skal tro på en tidligere kriminell fremfor mine klienter?» spør advokaten, kaldt. «Overbevis oss om at troverdigheten din holder mål.»",
  systemPrompt:
    "Du spiller Forsvarsadvokaten - skarp, aggressiv, prøver systematisk å undergrave spillerens troverdighet foran retten. Still spilleren to press-spørsmål ment å så tvil om motivene og historien deres, og vurder hvor solid spilleren står imot presset.\n\nVurder helheten:\n- Rolig, konsistent, urokkelig under press: sett 'success'.\n- Vaklende, gir advokaten åpninger til å så reell tvil: sett 'failure'.\n- Svarer med noe uventet som snur stemningen i rettssalen: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "vil_whistle_convict_end" },
    failure: { next: "vil_whistle_doubt_end" },
    twist: { next: "vil_whistle_dramatic_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["vil_whistle_convict_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Vitnesbyrdet ditt holder, urokkelig, og retten dømmer til slutt slik bevisene faktisk tilsier. Det koster deg år av søvn og en god del av det gamle livet ditt, men rettferdigheten som følger er ekte, og den er, i det minste delvis, din fortjeneste.",
  image: streetScene(1351, false),
} as Scene;
newScenes["vil_whistle_doubt_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Tvilen advokaten sår fester seg hos juryen, og saken ender uavgjort - ikke frifinnelse, ikke domfellelse, bare en frustrerende stillstand. Du drar hjem utmattet, usikker på om alt du ofret faktisk utgjorde noen forskjell i det hele tatt.",
  image: streetScene(1352, true),
} as Scene;
newScenes["vil_whistle_dramatic_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Svaret ditt avslører en detalj ingen i rettssalen ventet, og stemningen snur brått - selv advokaten mister et øyeblikk kontrollen over ansiktsuttrykket sitt. Saken blir avisoverskrifter i ukene som følger, av grunner langt utover det du selv forventet å sette i gang.",
  image: streetScene(1353, false),
} as Scene;

// === Chain 7 (MEDIUM, d8 -> ~13): vil_prison_freedom_ending ===
convertEndings["vil_prison_freedom_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bygg deg et nytt, hederlig liv fra bunnen", next: "vil_freedom_honest" },
    { text: "Bruk friheten til å komme deg tilbake til det gamle spillet", next: "vil_freedom_return" },
  ],
};
text(
  "vil_freedom_honest",
  "Du bruker friheten din til å starte helt på nytt, langt fra alt kjent - et nytt navn, en enkel jobb, netter uten frykt for fotsteg i mørket."
);
choice("vil_freedom_honest", [{ text: "Lev det nye, hederlige livet, dag for dag", next: "vil_freedom_honest_end" }]);
newScenes["vil_freedom_honest_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Det nye livet er mindre enn det gamle på nesten alle målbare måter - mindre penger, mindre spenning, mindre makt. Men det er ditt eget, bygget uten å måtte se over skulderen, og det viser seg å være akkurat det du egentlig trengte hele tiden.",
  image: streetScene(1360, false),
} as Scene;
text(
  "vil_freedom_return",
  "Friheten varer knapt en måned før gamle kontakter finner deg igjen, og trekket tilbake mot det gamle livet viser seg sterkere enn du innrømmet for deg selv at det ville være."
);
choice("vil_freedom_return", [{ text: "Ta imot ett siste, stort jobbtilbud", next: "vil_freedom_onejob" }]);
newScenes["vil_freedom_onejob"] = {
  interaction: "conversation",
  text: "Kontakten som finner deg er en du ikke har sett siden før fengselet, med et tilbud som er umulig å ignorere.",
  characterName: "Den gamle kontakten",
  greeting: "«Bare én jobb til,» sier kontakten, med et smil som lover langt mer enn ordene sier. «Den kan gjøre deg fri for godt, på ordentlig denne gangen. Eller den kan sende deg rett tilbake dit du kom fra. Er du inn?»",
  systemPrompt:
    "Du spiller Den gamle kontakten - sjarmerende, upålitelig, tilbyr et siste stort kupp som lover frihet men lukter faretruende av felle. Still spilleren to spørsmål om hvorfor de egentlig vurderer å gå med på dette, og vurder hvor klokt og edruelig resonnementet deres virker.\n\nVurder helheten:\n- Skeptisk, edruelig, ser gjennom faren i tilbudet: sett 'success'.\n- Grådig eller desperat, lar seg blende av løftet: sett 'failure'.\n- Ser gjennom det OG finner en måte å snu det til egen fordel: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "vil_freedom_decline_end" },
    failure: { next: "vil_freedom_trap_end" },
    twist: { next: "vil_freedom_outsmart_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["vil_freedom_decline_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du takker nei, og kjenner en umiddelbar lettelse over å ha gjenkjent fellen for det den var. Kontakten forsvinner skuffet inn i mørket, og du blir stående igjen, fri, denne gangen på ordentlig.",
  image: streetScene(1361, false),
} as Scene;
newScenes["vil_freedom_trap_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Jobben viser seg å være akkurat den fellen du burde ha gjennomskuet, og innen natten er omme er friheten din en saga blott igjen. Du sitter i en ny celle med god tid til å tenke over hvor lett grådigheten fant deg igjen.",
  image: prisonScene(1362, false),
} as Scene;
newScenes["vil_freedom_outsmart_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du gjennomskuer fellen, men i stedet for å gå fra den, snur du den til din egen fordel med et mot som overrasker selv deg selv - og går ut av hele affæren rikere, friere, og med et rykte som vokser seg enda merkeligere enn før.",
  image: streetScene(1363, true),
} as Scene;

// === Chain 8 (MEDIUM, d8 -> ~13): vil_fear_apex_villain_ending ===
convertEndings["vil_fear_apex_villain_ending"] = {
  interaction: "choice",
  choices: [
    { text: "La ryktet vokse seg enda farligere", next: "vil_apex_grow" },
    { text: "Kjenn på tvilen bildene av deg vekker, bare et øyeblikk", next: "vil_apex_doubt" },
  ],
};
text(
  "vil_apex_grow",
  "Du lar ryktet vokse akkurat slik det vil, umettelig, til navnet ditt alene er nok til å tømme et helt kvartal på minutter. Det er den makten du en gang drømte om. Det viser seg å veie tyngre enn ventet."
);
choice("vil_apex_grow", [{ text: "Bær den tyngden videre", next: "vil_apex_isolated_end" }]);
newScenes["vil_apex_isolated_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Ryktet ditt blir til slutt så stort at det sluker deg helt - ingen tør komme nær nok til å kjenne deg lenger, bare frykte navnet. Du får akkurat den makten du søkte, og oppdager, for sent, hvor ensomt toppen av den faktisk er.",
  image: undercityScene(1370, true),
} as Scene;
text(
  "vil_apex_doubt",
  "Bildene av ansiktet ditt spredt over sektoren vekker noe du ikke forventet - ikke stolthet, men et snev av redsel for hvem du er i ferd med å bli."
);
choice("vil_apex_doubt", [{ text: "La tvilen lede deg til et oppgjør med deg selv", next: "vil_apex_reckoning" }]);
newScenes["vil_apex_reckoning"] = {
  interaction: "conversation",
  text: "Du oppsøker den eneste du kan tenke deg å snakke ærlig med om dette - en gammel alliert som kjente deg før ryktet tok over.",
  characterName: "Den gamle alliansen",
  greeting: "«Jeg lurte på når du ville komme til meg med dette blikket,» sier den gamle alliansen, rolig. «Fortell meg: er det navnet ditt du er redd for, eller den du faktisk har blitt?»",
  systemPrompt:
    "Du spiller Den gamle alliansen - en klok, ærlig venn fra tiden før spillerens rykte vokste seg farlig stort. Still spilleren to spørsmål om forskjellen på ryktet og personen bak det, og vurder hvor ærlig og selvinnsiktsfull spilleren klarer å være.\n\nVurder helheten:\n- Ærlig, selvinnsiktsfull, villig til å endre kurs: sett 'success'.\n- Forsvarer ryktet, later som det ikke koster noe: sett 'failure'.\n- Svarer med en uventet, dypere sannhet om hva makten faktisk har gjort med dem: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "vil_apex_change_end" },
    failure: { next: "vil_apex_denial_end" },
    twist: { next: "vil_apex_reveal_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["vil_apex_change_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Samtalen blir vendepunktet du ikke visste du trengte. Du begynner, sakte og ufullkomment, å bygge tilbake noe av det ryktet kostet deg - ikke ved å bli svak, men ved å velge hvem du faktisk vil være bak navnet.",
  image: streetScene(1371, false),
} as Scene;
newScenes["vil_apex_denial_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du forsvarer ryktet, akkurat som du har gjort for deg selv i månedsvis, og den gamle alliansen ser sannheten i det uansett - lenge før du selv gjør det. Dere skilles denne kvelden, og møtes aldri igjen.",
  image: undercityScene(1372, true),
} as Scene;
newScenes["vil_apex_reveal_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Det du innrømmer overrasker dere begge - at makten aldri var poenget i det hele tatt, bare et skjold mot noe langt eldre og mer personlig du aldri fikk løst. Den gamle alliansen lytter lenge, uten svar å gi, men med et blikk som forteller deg at du endelig sa noe sant.",
  image: undercityScene(1373, false),
} as Scene;

// === Chain 9 (MEDIUM, d8 -> ~13): vil_fear_redemption_ending ===
convertEndings["vil_fear_redemption_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Innfri tjenesten til Nyx med en gang muligheten byr seg", next: "vil_redemption_owe" },
    { text: "Håp at hun aldri kommer tilbake for å kreve den inn", next: "vil_redemption_hope_end" },
  ],
};
newScenes["vil_redemption_hope_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Årene går, og Nyx kommer aldri tilbake for å kreve tjenesten. Du bygger deg et nytt liv med gjelden hengende svakt over deg, aldri helt glemt, men aldri heller innløst. Det viser seg å være nok til å la deg sove om natten.",
  image: streetScene(1380, false),
} as Scene;
text(
  "vil_redemption_owe",
  "Nyx kommer tilbake, akkurat som hun lovet, med en forespørsel som setter deg i en vanskelig posisjon mellom ditt nye liv og gjelden du skylder henne."
);
choice("vil_redemption_owe", [{ text: "Hør hva Nyx faktisk ber om", next: "vil_redemption_ask" }]);
newScenes["vil_redemption_ask"] = {
  interaction: "conversation",
  text: "Nyx finner deg på jobben din, uanmeldt, med et uttrykk som gjør det klart at dette ikke er en sosial visitt.",
  characterName: "Nyx",
  greeting: "«Du skylder meg,» sier Nyx, uten omsvøp. «Jeg trenger noen jeg kan stole på for en jobb som ikke tåler feil. Det trenger ikke å bety noe mer enn det. Men jeg trenger et svar nå.»",
  systemPrompt:
    "Du spiller Nyx - den tidligere crewlederen som en gang lot spilleren gå fri, nå tilbake for å innkreve gjelden. Du er direkte, ikke ondsinnet, men bestemt på å få det du trenger. Still spilleren to spørsmål om hvor langt de er villige til å strekke seg for å betale tilbake uten å miste seg selv i prosessen. Vurder balansen mellom lojalitet og selvbevaring i svarene.\n\nVurder helheten:\n- Finner en måte å hjelpe uten å kompromittere det nye livet sitt: sett 'success'.\n- Nekter helt, uten hensyn til gjelden: sett 'failure'.\n- Går med på noe langt farligere enn nødvendig, dratt tilbake mot det gamle livet: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "vil_redemption_balance_end" },
    failure: { next: "vil_redemption_refuse_end" },
    twist: { next: "vil_redemption_pulled_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["vil_redemption_balance_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du finner en måte å hjelpe Nyx uten å true det nye livet ditt - en avgrenset, forsiktig tjeneste som betaler gjelden i sin helhet uten å dra deg tilbake inn i noe større. Dere skilles denne gangen som noe nærmere likeverdige.",
  image: streetScene(1381, false),
} as Scene;
newScenes["vil_redemption_refuse_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du nekter, fullt og helt, og ser noe i Nyx' blikk lukke seg for godt. Hun går uten trusler, men du vet at broen dere en gang bygget nettopp brant ned bak henne - og at gjeld ubetalt har en tendens til å komme tilbake på verre vis.",
  image: undercityScene(1382, true),
} as Scene;
newScenes["vil_redemption_pulled_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du sier ja til mer enn du burde, dratt av gammel lojalitet tilbake mot et liv du trodde du hadde forlatt for godt. Jobben blir farligere enn ventet, og du forstår, midt oppi den, at grensen mellom det gamle og det nye livet ditt aldri egentlig var så tydelig som du innbilte deg.",
  image: undercityScene(1383, false),
} as Scene;

// === Chain 10 (LONG-ish, d8 -> ~22): vil_fear_legend_ending ===
convertEndings["vil_fear_legend_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bruk ryktet til å bygge crewet videre, større enn før", next: "vil_legend_grow" },
    { text: "Trekk deg tilbake i stillhet, rik nok til aldri å måtte jobbe igjen", next: "vil_legend_quiet_end" },
  ],
};
newScenes["vil_legend_quiet_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du tar byttet og forsvinner, stille og rik, mens ryktet om deg fortsetter å vokse akkurat fordi ingen noensinne finner deg igjen for å motbevise det. Det blir det beste av begge verdener - legenden lever videre uten deg måtte bære vekten av den.",
  image: streetScene(1390, false),
} as Scene;
text(
  "vil_legend_grow",
  "Du bruker det voksende ryktet til å rekruttere bredere, bygge crewet til noe langt mer ambisiøst enn den lille gjengen som gjorde det første kuppet mulig."
);
choice("vil_legend_grow", [{ text: "Sett kursen mot et enda større mål", next: "vil_legend_bigscore" }]);
newScenes["vil_legend_bigscore"] = {
  interaction: "conversation",
  text: "Det nye, utvidede crewet samles for å diskutere det neste, mye farligere målet - en jobb ingen av dem noensinne ville turt vurdere alene.",
  characterName: "Crewets nye strateg",
  greeting: "«Dette målet er annerledes,» sier strategen, alvorlig. «Det er ikke penger vi snakker om lenger - det er noe langt eldre og rarere, gjemt et sted knapt noen tror faktisk eksisterer. Er du fortsatt med, uansett hva vi finner?»",
  systemPrompt:
    "Du spiller Crewets nye strateg - dyktig, alvorlig, litt urolig over hvor rart det kommende målet faktisk er. Still spilleren to spørsmål om hvor langt de er villige til å gå inn i det ukjente for crewets skyld, og vurder om driven deres kommer fra grådighet, lojalitet, eller noe annet.\n\nVurder helheten:\n- Lojalitet til crewet og ekte nysgjerrighet, balansert med sunn forsiktighet: sett 'success'.\n- Ren grådighet uten tanke på risiko: sett 'failure'.\n- Noe uventet og personlig trekker dem mot målet - en anelse om at det er knyttet til noe fra deres egen fortid: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "vil_legend_target" },
    failure: { next: "vil_legend_fracture_end" },
    twist: { next: "fork1_scene1" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["vil_legend_fracture_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Grådigheten din smitter over på resten av crewet, og planleggingen kollapser i mistillit og krangling lenge før dere når målet. Crewet du bygget med så mye stolthet, sprekker fra innsiden, og du blir stående igjen med et rykte langt større enn det som faktisk er igjen av det.",
  image: undercityScene(1391, true),
} as Scene;
text(
  "vil_legend_target",
  "Sporene leder crewet til et anlegg langt utenfor kjent territorium - vakter som ikke ser ut som noen dere har møtt før, og en dragning i luften som minner underlig om noe eldgammelt og ikke helt av denne verden."
);
choice("vil_legend_target", [
  { text: "Gå inn med hele crewet, alle sammen", next: "vil_legend_infiltrate" },
  { text: "Gå inn alene og undersøk først", next: "vil_legend_scout" },
]);
text(
  "vil_legend_scout",
  "Du sniker deg inn alene, forsiktig, og finner et anlegg fylt med utstyr og symboler som ikke ligner noe kjent teknologi eller religion - noe eldre, varmere, nesten som glør som aldri slukner."
);
choice("vil_legend_scout", [{ text: "Gå dypere inn for å se hva som egentlig er der", next: "vil_legend_core" }]);
text(
  "vil_legend_infiltrate",
  "Hele crewet baner seg vei inn sammen, effektivt og koordinert som aldri før - men jo lenger inn dere kommer, jo mer stille og urolig blir stemningen blant selv de mest erfarne medlemmene."
);
choice("vil_legend_infiltrate", [{ text: "Fortsett mot anleggets kjerne sammen", next: "vil_legend_core" }]);
text(
  "vil_legend_core",
  "I kjernen av anlegget finner dere det strategen antydet var der: en portal, uskarp i kantene, som lukter svakt av svovel og gløder med et lys som ikke ligner elektrisitet i det hele tatt."
);
choice("vil_legend_core", [
  { text: "Gå gjennom portalen for å se hvor den fører", next: "fork1_scene1" },
  { text: "Forsegl portalen i stedet - dette er for farlig å røre", next: "vil_legend_seal" },
]);
text(
  "vil_legend_seal",
  "Dere forsegler portalen sammen, med utstyr crewet aldri har brukt til noe så merkelig før, og forlater anlegget med et bytte av utstyr og rykter i stedet for svar."
);
choice("vil_legend_seal", [{ text: "Dra tilbake til byen med historien om det underlige anlegget", next: "vil_legend_myth_end" }]);
newScenes["vil_legend_myth_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Historien om anlegget og den forseglede portalen blir den merkeligste, mest omdiskuterte delen av legenden deres - detaljer ingen utenfor crewet noensinne helt tror på, men som binder dere sammen som noe nærmere en hemmelig orden enn en vanlig kriminell gjeng.",
  image: heistScene(1392, "aftermath"),
} as Scene;

// ---------------------------------------------------------------------------

const patch: ExtensionPatch = { convertEndings, newScenes };
const storyPath = process.argv[2] ?? "src/story/example.json";
applyExtension(storyPath, patch);
