import type { ConversationScene, QuestionScene, Scene } from "../src/types/story.ts";
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

const SPACE_PALETTE = ["#0a0c1a", "#161c30", "#2a3252", "#4a5a8a", "#c9d2f0", "#5a6a9a", "#0c0e18", "#ffce7a", "#7fe8ff"];
const COCKPIT_PALETTE = ["#0e0a10", "#1e1626", "#3a2c46", "#8a7aae", "#e8d8ff", "#3f2a5a", "#0a0710", "#ff6f5a", "#7fe8ff"];
const PALACE_PALETTE = ["#1a1020", "#2c1e3a", "#463a5e", "#8a7aae", "#f0e6d8", "#c9a04a", "#0c0a10", "#ffd27f", "#e8c9ff"];
const INTERROGATION_PALETTE = ["#0a0a0c", "#18181e", "#2a2a34", "#5a5a68", "#d8d8e0", "#2f6f8a", "#050506", "#ff6f5a", "#8890a0"];

function starsBackdrop(grid: Grid, colorIdx: number, count: number, maxY: number, seed: number) {
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    grid[Math.floor(rng() * maxY)][Math.floor(rng() * 128)] = colorIdx;
  }
}

function shipSilhouette(grid: Grid, x: number, y: number, body: number, trim: number, scale = 1) {
  const s = (n: number) => Math.round(n * scale);
  fillRect(grid, x, y + s(4), s(24), s(8), body);
  fillRect(grid, x + s(20), y, s(8), s(16), body);
  fillRect(grid, x + s(6), y + s(10), s(4), s(6), trim);
  fillRect(grid, x + s(16), y + s(10), s(4), s(6), trim);
}

function hangarScene(seed: number, calm: boolean) {
  const grid = createGrid(128, 128, 0);
  starsBackdrop(grid, 8, 30, 50, seed);
  fillRect(grid, 0, 80, 128, 48, 2);
  noiseDither(grid, 0, 80, 128, 48, 3, 0.12, mulberry32(seed + 1));
  outlineRect(grid, 20, 40, 88, 40, 4, 5);
  shipSilhouette(grid, 34, 48, 5, 4, 2.4);
  playerBack(grid, 92, 96, 4, 3.4);
  const glow = [...radialGlow(64, 100, calm ? 10 : 16, calm ? "pulse" : "flicker", calm ? "#7fe8ff" : "#ffce7a", mulberry32(seed + 2))];
  return buildSpec(128, 128, SPACE_PALETTE, grid, glow);
}

function cockpitScene(seed: number, alarm: boolean) {
  const grid = createGrid(128, 128, 0);
  starsBackdrop(grid, 8, 40, 60, seed);
  outlineRect(grid, 10, 70, 108, 50, 3, 5);
  noiseDither(grid, 10, 70, 108, 50, alarm ? 7 : 4, 0.15, mulberry32(seed + 1));
  fillRect(grid, 40, 96, 48, 10, 5);
  fillRect(grid, 48, 100, 6, 4, alarm ? 7 : 4);
  fillRect(grid, 62, 100, 6, 4, alarm ? 7 : 4);
  fillRect(grid, 76, 100, 6, 4, alarm ? 7 : 4);
  playerBack(grid, 56, 106, 5, 2.6);
  const glow = [...radialGlow(64, 100, 14, alarm ? "flicker" : "pulse", alarm ? "#ff6f5a" : "#7fe8ff", mulberry32(seed + 2))];
  return buildSpec(128, 128, COCKPIT_PALETTE, grid, glow);
}

function palaceScene(seed: number, formal: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 14, 20, 100, 90, 4, 6);
  noiseDither(grid, 14, 20, 100, 90, 3, 0.08, mulberry32(seed));
  fillRect(grid, 30, 100, 68, 10, 5);
  fillRect(grid, 54, 28, 20, 30, 5); // banner / throne backdrop
  playerBack(grid, 58, 78, 5, 3.4);
  const glow = [...radialGlow(64, 40, formal ? 16 : 10, "sparkle", "#ffd27f", mulberry32(seed + 1))];
  return buildSpec(128, 128, PALACE_PALETTE, grid, glow);
}

function interrogationScene(seed: number, tense: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 24, 30, 80, 70, 3, 1);
  noiseDither(grid, 24, 30, 80, 70, tense ? 7 : 4, 0.1, mulberry32(seed));
  fillRect(grid, 40, 90, 48, 6, 4);
  playerBack(grid, 36, 60, 4, 3);
  playerBack(grid, 84, 60, 4, 3);
  const glow = [{ x: 64, y: 20, animation: "flicker" as const, color: tense ? "#ff6f5a" : "#d8d8e0" }];
  return buildSpec(128, 128, INTERROGATION_PALETTE, grid, glow);
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

// === Chain 1 (SHORT, d6 -> ~8): pil_vask_quiet_ending ===
convertEndings["pil_vask_quiet_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Fortsett akkurat som før, uten å forvente noe", next: "pil_vask_quiet_continue_end" },
    { text: "La deg selv innrømme at du håper noen legger merke til det en dag", next: "pil_vask_quiet_hope" },
  ],
};
newScenes["pil_vask_quiet_continue_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du fortsetter akkurat som før, år etter år, stille og grundig. Ingen skriver navnet ditt i noen journal, men hangaren er tryggere for det, og du vet det, og det er, til slutt, akkurat nok for deg.",
  image: hangarScene(1200, true),
} as Scene;
text(
  "pil_vask_quiet_hope",
  "Du innrømmer det for deg selv, bare denne ene gangen - at en liten del av deg håper noen en dag ser hva du faktisk gjør her. Ønsket overrasker deg mer enn du forventet."
);
choice("pil_vask_quiet_hope", [{ text: "Fortsett jobben, med det ønsket i bakhodet", next: "pil_vask_quiet_noticed_end" }]);
newScenes["pil_vask_quiet_noticed_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Måneder senere legger en ny offiser merke til hvor upåklagelig hangar tre alltid er, og spør rundt til hun finner ut hvem som står bak. Anerkjennelsen som følger er liten - et nikk, et takk, en bedre stilling - men den treffer dypere enn du var forberedt på.",
  image: hangarScene(1201, true),
} as Scene;

// === Chain 2 (SHORT, d9 -> ~11): pil_anomaly_fight_ending ===
convertEndings["pil_anomaly_fight_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Meld fra om anomalien med en gang du lander", next: "pil_anomaly_report_end" },
    { text: "Behold det for deg selv - ingen ville tro deg uansett", next: "pil_anomaly_silent_end" },
  ],
};
newScenes["pil_anomaly_report_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Rapporten din blir møtt med skepsis i starten, men nok andre piloter melder inn lignende hendelser i månedene som følger til at noen endelig tar det på alvor. Du blir aldri kjendis for det, men du vet at varselet ditt kan ha reddet noen andre fra samme skrekk.",
  image: cockpitScene(1210, false),
} as Scene;
newScenes["pil_anomaly_silent_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du sier ingenting, og flyr videre som om ingenting skjedde. Men noen netter, alene i cockpiten, kjenner du deg selv sjekke instrumentene et ekstra sekund lenger enn nødvendig, som om himmelen fortsatt kunne finne på noe.",
  image: cockpitScene(1211, true),
} as Scene;

// === Chain 3 (SHORT, d9 -> ~11): pil_pilot_grounded_ending ===
convertEndings["pil_pilot_grounded_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Be om en ny sjanse i simulatoren", next: "pil_grounded_retry_end" },
    { text: "Godta at kanskje pilotlivet ikke er for deg", next: "pil_grounded_accept_end" },
  ],
};
newScenes["pil_grounded_retry_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du trener hardt i simulatoren i månedene som følger, og blir sakte bedre - aldri helt kvitt nervene fra den dagen, men god nok til å fly igjen med en forsiktighet som, ironisk nok, gjør deg til en tryggere pilot enn før.",
  image: cockpitScene(1220, false),
} as Scene;
newScenes["pil_grounded_accept_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du bytter spor, uten bitterhet, til noe som passer roen din bedre - bakkemannskap, kanskje, eller opplæring av andre. Det er ikke skammen du fryktet. Det er bare et annet slags viktig.",
  image: hangarScene(1221, true),
} as Scene;

// === Chain 4 (MEDIUM, d9 -> ~14): pil_mek_hero_ending ===
convertEndings["pil_mek_hero_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bruk anerkjennelsen til å presse på for bedre vedlikeholdsrutiner", next: "pil_mek_hero_reform" },
    { text: "Ta imot æren, og fortsett som før", next: "pil_mek_hero_settle_end" },
  ],
};
newScenes["pil_mek_hero_settle_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du tar imot æren med et smil og fortsetter jobben din akkurat som før, kanskje litt mer respektert i korridorene. Det er en god slutt på en skummel dag, og du trenger ikke mer enn det.",
  image: hangarScene(1230, true),
} as Scene;
text(
  "pil_mek_hero_reform",
  "Du bruker den plutselige oppmerksomheten mens den varer, og legger frem en liste over alt du så gikk galt den dagen - reléet ingen sjekket, rutinene som ble kuttet for å spare tid."
);
choice("pil_mek_hero_reform", [{ text: "Legg frem forslaget for teknisk sjef", next: "pil_mek_hero_meeting" }]);
newScenes["pil_mek_hero_meeting"] = {
  interaction: "conversation",
  text: "Teknisk sjef lytter til forslaget ditt med et blikk som veksler mellom respekt og en viss utålmodighet - endring koster tid, og tid er alltid knapt.",
  characterName: "Teknisk sjef",
  greeting: "«Du reddet oss én gang,» sier teknisk sjef, «men å endre rutinene for hele hangaren er noe helt annet. Overbevis meg om at dette faktisk er verdt bryet.»",
  systemPrompt:
    "Du spiller Teknisk sjef - travel, pragmatisk, ikke uvillig til endring men skeptisk til alt som koster tid uten klar gevinst. Still spilleren to spørsmål om hvordan forslaget faktisk skal gjennomføres uten å stanse hele driften, og vurder hvor gjennomtenkt og realistisk planen virker.\n\nVurder helheten:\n- Konkret, gjennomførbar, viser forståelse for driftens begrensninger: sett 'success'.\n- Vag, urealistisk, ignorerer kostnadene ved endring: sett 'failure'.\n- Overraskende smart løsning som får til begge deler samtidig: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "pil_mek_hero_reform_end" },
    failure: { next: "pil_mek_hero_shelved_end" },
    twist: { next: "pil_mek_hero_standard_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["pil_mek_hero_reform_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "De nye rutinene blir innført gradvis, uten å stanse driften, akkurat slik du foreslo. Et år senere er hangaren målbart tryggere, og ingen andre relér svikter uoppdaget på din vakt igjen.",
  image: hangarScene(1231, true),
} as Scene;
newScenes["pil_mek_hero_shelved_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Forslaget blir lagt i en skuff «til vurdering», og blir aldri hørt fra igjen. Du fortsetter jobben din, litt skuffet, men ikke overrasket - det er ikke første gang en god idé taper mot travelheten.",
  image: hangarScene(1232, false),
} as Scene;
newScenes["pil_mek_hero_standard_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Løsningen din blir så elegant at teknisk sjef innfører den som standard i hele flåten, ikke bare hangaren din. Navnet ditt havner, til din egen overraskelse, på selve rutinedokumentet - en liten, varig del av hvordan ting nå gjøres.",
  image: hangarScene(1233, true),
} as Scene;

// === Chain 5 (MEDIUM, d9 -> ~14): pil_vask_hero_ending ===
convertEndings["pil_vask_hero_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bruk anerkjennelsen til å søke om en formell stilling utenfor renhold", next: "pil_vask_hero_apply" },
    { text: "Nyt anerkjennelsen, og fortsett som du er", next: "pil_vask_hero_settle_end" },
  ],
};
newScenes["pil_vask_hero_settle_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du tar imot takken fra alle du hjalp den dagen og fortsetter jobben din, kjentere i korridorene nå enn du noensinne var før - ikke lenger usynlig, men fortsatt akkurat der du selv ønsker å være.",
  image: hangarScene(1240, true),
} as Scene;
text(
  "pil_vask_hero_apply",
  "Med anerkjennelsen friskt i minne bestemmer du deg for å søke deg videre - kanskje bakkemannskap, kanskje til og med akademiet selv, denne gangen med bevis på at du hører hjemme der."
);
choice("pil_vask_hero_apply", [{ text: "Møt til opptakssamtalen", next: "pil_vask_hero_interview" }]);
newScenes["pil_vask_hero_interview"] = {
  interaction: "conversation",
  text: "Opptakskomiteen har allerede hørt historien om krisen, men de vil høre den fra deg selv før de bestemmer seg.",
  characterName: "Opptakskomiteens leder",
  greeting: "«Vi har lest rapporten,» sier komiteens leder, «men rapporter forteller sjelden hele historien. Fortell oss hvorfor du egentlig ble her i hangaren så lenge, i stedet for å søke deg videre tidligere.»",
  systemPrompt:
    "Du spiller Opptakskomiteens leder - rettferdig, men grundig, ønsker å forstå spillerens egentlige motivasjon og selvinnsikt, ikke bare heltedåden. Still spilleren to spørsmål om hvorfor de ble i renholdsjobben så lenge og hva de egentlig søker nå. Vurder ærlighet og selvinnsikt i svarene.\n\nVurder helheten:\n- Ærlig, selvinnsiktsfull, viser ekte motivasjon: sett 'success'.\n- Vag, later som fortiden ikke betyr noe, lite selvinnsikt: sett 'failure'.\n- Svaret avslører noe uventet og interessant komiteen ikke hadde tenkt på: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "pil_vask_hero_admitted_end" },
    failure: { next: "pil_vask_hero_rejected_end" },
    twist: { next: "pil_vask_hero_special_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["pil_vask_hero_admitted_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Komiteen tar deg opp, imponert av ærligheten din like mye som handlingen din under krisen. Du begynner på nytt, et annet sted i hangarhierarkiet enn du noensinne trodde du ville havne - ikke lenger usynlig, aldri igjen.",
  image: palaceScene(1241, true),
} as Scene;
newScenes["pil_vask_hero_rejected_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Komiteen takker deg for heltedåden, men avslår søknaden - svarene dine overbeviser dem ikke om at du egentlig vet hva du søker. Du drar tilbake til hangaren, skuffet, men ikke knust, og fortsetter jobben du i det minste vet du er god på.",
  image: hangarScene(1242, false),
} as Scene;
newScenes["pil_vask_hero_special_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Noe i svaret ditt får komiteens leder til å utveksle et blikk med de andre - en detalj, en observasjon om hangaren ingen andre har lagt merke til på år. De tilbyr deg en stilling ingen visste eksisterte før dette møtet: en som ser ting andre overser. Du aner ikke ennå hva den egentlig innebærer.",
  image: palaceScene(1243, false),
} as Scene;

// === Chain 6 (LONG-ish, d9 -> ~22): pil_pilot_hero_ending ===
convertEndings["pil_pilot_hero_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Bli i akademiet - det er fortsatt mer å lære", next: "pil_hero_stay" },
    { text: "Søk deg videre til en ekte flåte med en gang", next: "pil_hero_fleet_apply" },
  ],
};
text(
  "pil_hero_stay",
  "Du blir et ekstra år, ikke fordi du må, men fordi heltedåden din ga deg en ny respekt for hvor mye du fortsatt ikke kan. Instruktørene begynner å behandle deg annerledes - mindre som en kadett, mer som en kollega i opplæring."
);
choice("pil_hero_stay", [{ text: "Ta imot tilbudet om avansert trening", next: "pil_hero_advanced" }]);
newScenes["pil_hero_advanced"] = {
  interaction: "conversation",
  text: "Den avanserte treningen ledes av en pilot med et rykte like stort som skarene av arr på hendene hennes.",
  characterName: "Veteranpiloten Kess",
  greeting: "«Krisen din var flaks like mye som ferdighet,» sier Kess, uten fiendtlighet, bare ærlighet. «Spørsmålet er om du er villig til å bygge ferdigheten opp så flaksen ikke må redde deg neste gang. Er du?»",
  systemPrompt:
    "Du spiller Veteranpiloten Kess - streng, ærlig, respektfull mot ekte innsats men utålmodig med skryt. Still spilleren to spørsmål om hvor mye de egentlig er villige til å ofre for å bli en dyktig pilot, ikke bare en heldig en. Vurder ydmykhet og driv i svarene.\n\nVurder helheten:\n- Ydmyk, driven, villig til å jobbe hardt uten å late som de allerede er ferdige: sett 'success'.\n- Overmodig, tror flaksen betyr de allerede er gode nok: sett 'failure'.\n- Overraskende dypt motivert av noe personlig Kess ikke ventet: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "pil_hero_training_good" },
    failure: { next: "pil_hero_training_bad" },
    twist: { next: "pil_hero_training_twist" },
  },
  maxTurns: 6,
} as ConversationScene;
text(
  "pil_hero_training_bad",
  "Kess ser rett gjennom skrytet ditt, og treningen som følger blir hardere enn nødvendig - en leksjon i ydmykhet du åpenbart trengte. Det tar måneder før hun begynner å stole på deg igjen."
);
choice("pil_hero_training_bad", [{ text: "Stå gjennom den harde treningen", next: "pil_hero_humbled_end" }]);
newScenes["pil_hero_humbled_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du kommer ut på andre siden av treningen mer ydmyk enn du gikk inn, og en langt bedre pilot for det - selv om stoltheten din bærer noen arr Kess aldri ba om unnskyldning for å gi deg.",
  image: cockpitScene(1250, false),
} as Scene;
text(
  "pil_hero_training_good",
  "Kess nikker, fornøyd med svarene dine, og treningen som følger blir intens men rettferdig - hun presser deg hardt fordi hun tror du tåler det, ikke for å knuse deg."
);
choice("pil_hero_training_good", [{ text: "Fullfør den avanserte treningen", next: "pil_hero_squadron" }]);
text(
  "pil_hero_squadron",
  "Du blir uteksaminert med noen av de beste karakterene akademiet har sett på år, og tilbys en plass i en av flåtens mest ettertraktede skvadroner - en sjanse langt større enn den du noensinne forventet fra en kadett som nesten mislyktes i sin første krise."
);
choice("pil_hero_squadron", [
  { text: "Ta imot plassen i den prestisjetunge skvadronen", next: "pil_hero_elite_path" },
  { text: "Be heller om å bli utplassert der behovet er størst, ikke der æren er størst", next: "pil_hero_frontier_path" },
]);
newScenes["pil_hero_frontier_path"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du velger tjenesten fremfor æren, og havner i utkanten av flåten, langt fra flagg og parader, der behovet faktisk er størst. Det blir aldri den glamorøse karrieren skvadronen ville gitt deg, men det blir en du er stolt av hver eneste dag.",
  image: cockpitScene(1251, false),
} as Scene;
text(
  "pil_hero_elite_path",
  "Du tar imot plassen, og skvadronen blir raskt en ny slags familie - dyktige, skarpe, konkurransedyktige piloter som presser hverandre til å bli bedre år for år."
);
choice("pil_hero_elite_path", [{ text: "Finn din plass i skvadronen", next: "pil_hero_squadron_life" }]);
text(
  "pil_hero_squadron_life",
  "Årene i skvadronen former deg til en av flåtens mest respekterte piloter, kjent for presisjonen som en gang reddet et helt hangarskip. Så, en dag, kommer et oppdrag som er ulikt alt annet du har fløyet før - en dypere, farligere anomali enn den som startet alt dette."
);
choice("pil_hero_squadron_life", [{ text: "Ta imot det farlige oppdraget", next: "pil_hero_deep_mission" }]);
newScenes["pil_hero_deep_mission"] = {
  interaction: "question",
  text: "Oppdragsbriefingen er kryptisk med vilje - alt de tør si er at anomalien reagerer på et bestemt ord, et kommando-signal fra de gamle protokollene ingen lenger husker utenat. Du må finne det riktige ordet i arkivet før avgang: hva heter kommandoen som ber en ukjent kraft om å «stå ned»?",
  acceptedAnswers: ["stand down", "stand-down", "reager ikke", "hold stand"],
  onCorrect: { next: "pil_hero_deep_success" },
  onIncorrect: { next: "pil_hero_deep_scramble_end" },
  maxAttempts: 3,
} as QuestionScene;
newScenes["pil_hero_deep_scramble_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du finner ikke riktig kommando i tide, og oppdraget skrinlegges i siste liten - en fiasko ingen snakker høyt om, men som likevel følger deg. Skvadronen flyr videre uten deg den dagen. Karrieren din overlever det, men du bærer med deg en uro over hva som kunne gått galt.",
  image: cockpitScene(1252, true),
} as Scene;
text(
  "pil_hero_deep_success",
  "Kommandoen virker, akkurat som håpet - anomalien roer seg idet du sender signalet, og du fører skvadronen trygt gjennom det som kunne blitt en katastrofe langt større enn krisen som startet karrieren din."
);
choice("pil_hero_deep_success", [{ text: "Land skvadronen trygt hjem", next: "pil_hero_legend_end" }]);
newScenes["pil_hero_legend_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Historien om deg - kadetten som reddet et hangarskip og senere temmet en anomali ingen andre turte nærme seg - blir en av akademiets faste fortellinger, fortalt til nye kadetter i årene som følger. Du selv husker det annerledes: bare som en lang rekke valg om å prøve, uansett hvor redd du var.",
  image: cockpitScene(1253, false),
} as Scene;
newScenes["pil_hero_training_twist"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Noe i svaret ditt rører ved noe personlig hos Kess - en gammel historie hun aldri forteller kadetter, men som tydelig gjenkjenner seg selv i deg. Treningen som følger blir uvanlig personlig, nesten som et mentorskap ingen andre kadetter får. Du aner ikke helt hvorfor du fortjener det, men du tar imot det.",
  image: cockpitScene(1254, false),
} as Scene;
text(
  "pil_hero_fleet_apply",
  "Du hopper over ekstra trening og søker deg rett til flåten, sulten på ekte oppdrag etter alt du nettopp beviste under krisen. Overgangen blir brutal - flåten bryr seg lite om akademiets heltehistorier."
);
choice("pil_hero_fleet_apply", [{ text: "Prøv å bevise deg selv på nytt, fra bunnen", next: "pil_hero_fleet_rookie" }]);
text(
  "pil_hero_fleet_rookie",
  "De første ukene i flåten er ydmykende - ingen bryr seg om ryktet ditt fra akademiet, og du gjør flere feil enn du er vant til å innrømme. Men sakte, gjennom rene timer i cockpiten, begynner respekten å komme på nytt, denne gangen fortjent fra bunnen av."
);
choice("pil_hero_fleet_rookie", [{ text: "Fortsett å bevise deg selv, dag for dag", next: "pil_hero_fleet_earned_end" }]);
newScenes["pil_hero_fleet_earned_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Etter måneder med hardt, umerkelig arbeid blir du til slutt akseptert av flåten på dens egne premisser, ikke akademiets rykte. Det er en tregere, tyngre vei til respekt enn den du hadde i akademiet, men den kjennes mer ekte for hvert steg.",
  image: cockpitScene(1255, false),
} as Scene;

// === Chain 7 (MEDIUM-LONG, d9 -> ~17): pil_mek_conspiracy_ending ===
convertEndings["pil_mek_conspiracy_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Grav videre i mønsteret selv, i det stille", next: "pil_mek_dig" },
    { text: "Meld fra til overordnede med en gang", next: "pil_mek_conspiracy_report" },
  ],
};
text(
  "pil_mek_conspiracy_report",
  "Du melder fra umiddelbart, og saken blir tatt over av folk med langt mer myndighet enn deg. Du blir holdt utenfor resten av etterforskningen, en beslutning som gnager på deg selv om du vet den er fornuftig."
);
choice("pil_mek_conspiracy_report", [{ text: "Vent på beskjed om hva som skjer videre", next: "pil_mek_conspiracy_report_wait_end" }]);
newScenes["pil_mek_conspiracy_report_wait_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Måneder senere kommer det en kort, byråkratisk melding om at «saken er lukket». Du får aldri vite hva som egentlig lå bak sabotasjen, og lærer å leve med den ubehagelige uvissheten - trygg i visshet om at du i det minste gjorde det rette ved å si fra.",
  image: hangarScene(1260, false),
} as Scene;
text(
  "pil_mek_dig",
  "Du graver videre på egen hånd, forsiktig, og finner spor som peker mot noen innenfor selve akademiets ledelse - et navn du gjenkjenner fra korridorene, noen du har hilst på uten å tenke deg om."
);
choice("pil_mek_dig", [{ text: "Konfronter personen direkte med det du har funnet", next: "pil_mek_confront" }]);
newScenes["pil_mek_confront"] = {
  interaction: "conversation",
  text: "Du finner personen alene i et lagerrom sent på kvelden, og legger frem det du har funnet før du rekker å tenke deg om konsekvensene.",
  characterName: "Den mistenkte offiseren",
  greeting: "«Du burde ikke ha funnet det der,» sier offiseren, stemmen kontrollert, men øynene raske og vurderende. «Spørsmålet er hva du har tenkt å gjøre med det nå som du har.»",
  systemPrompt:
    "Du spiller Den mistenkte offiseren - kontrollert, intelligent, forsøker å lese om spilleren er en trussel som må håndteres eller noen som kan overtales eller til og med rekrutteres. Still spilleren to spørsmål ment å avdekke hva slags person de er - lojale til systemet, korrupte selv, eller noe midt imellom. Vurder svarene nøye.\n\nVurder helheten:\n- Prinsippfast, ubestikkelig, tydelig på at sannheten skal frem: sett 'success'.\n- Usikker, mottakelig for press eller bestikkelser: sett 'failure'.\n- Svarer på en måte som avslører offiseren selv er mer sammensatt enn ren skurk - antyder en dypere sak: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "pil_mek_expose_end" },
    failure: { next: "pil_mek_bought_end" },
    twist: { next: "pil_mek_deeper" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["pil_mek_expose_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du holder fast ved at sannheten skal frem, uansett konsekvenser, og offiseren gir til slutt etter under tyngden av beviset og din egen urokkelige holdning. Saken blir stor nyhet i akademiet - ikke behagelig for noen, men riktig.",
  image: interrogationScene(1261, true),
} as Scene;
newScenes["pil_mek_bought_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Offiseren finner en sprekk i din egen besluttsomhet og utnytter den fullt ut - et tilbud, en trussel, en kombinasjon av begge, nok til at du til slutt lar saken ligge. Du lever videre med det valget, og det blir tyngre å bære enn du forventet.",
  image: interrogationScene(1262, false),
} as Scene;
text(
  "pil_mek_deeper",
  "Det som avdekkes er langt større enn en enkelt korrupt offiser - et helt nettverk, bygget over år, som strekker seg langt forbi denne ene hangaren. Du forstår plutselig at du har snublet inn i noe du aldri kan gå tilbake fra å vite."
);
choice("pil_mek_deeper", [
  { text: "Bruk det du vet til å infiltrere nettverket videre", next: "pil_mek_infiltrate_end" },
  { text: "Ta det du har og lever i skjul med kunnskapen resten av karrieren", next: "pil_mek_hidden_end" },
]);
newScenes["pil_mek_infiltrate_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du bruker den farlige kunnskapen din til sakte, forsiktig, å grave dypere inn i nettverket enn noen etterforskning noensinne offisielt ville tillate - en dobbeltrolle du aldri fortalte noen om, ført videre i det stille i alle årene som fulgte.",
  image: interrogationScene(1263, true),
} as Scene;
newScenes["pil_mek_hidden_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du velger sikkerheten fremfor sannheten, og bærer kunnskapen om nettverket som en tung, stille hemmelighet resten av karrieren - klar til å bruke den hvis noen noensinne truer deg direkte, men aldri modig nok til å avsløre den selv.",
  image: interrogationScene(1264, false),
} as Scene;

// === Chain 8 (MEDIUM-LONG, d9 -> ~16): pil_vask_royalty_ending ===
convertEndings["pil_vask_royalty_ending"] = {
  interaction: "choice",
  choices: [
    { text: "Følg aspiranten og avslør hvem de egentlig er", next: "pil_royalty_follow" },
    { text: "Se en annen vei - dette er ikke din kamp", next: "pil_royalty_ignore_end" },
  ],
};
newScenes["pil_royalty_ignore_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du lar det være. Hva enn den fremmede aspiranten egentlig holder på med, er ikke din byrde å bære, og du fortsetter jobben din i hangar tre med et vagt, uforløst spørsmål hengende i bakhodet resten av karrieren.",
  image: hangarScene(1270, false),
} as Scene;
text(
  "pil_royalty_follow",
  "Du følger etter aspiranten gjennom korridorer de tydeligvis navigerer med en selvsikkerhet ingen ekte nybegynner burde ha, helt til de forsvinner inn i et rom som ikke skal finnes på noen offisiell plantegning."
);
choice("pil_royalty_follow", [{ text: "Følg etter inn i rommet", next: "pil_royalty_reveal" }]);
newScenes["pil_royalty_reveal"] = {
  interaction: "conversation",
  text: "Rommet er innredet langt mer overdådig enn noe annet på hele akademiet, og aspiranten - uten uniformen nå - snur seg mot deg uten det minste snev av overraskelse.",
  characterName: "Aspiranten uten navn",
  greeting: "«Jeg lurte på når du ville følge etter,» sier aspiranten, med en verdighet som ikke passer noen nybegynner. «Siden du er her: ja, jeg er den du begynner å mistenke at jeg er. Spørsmålet er hva du har tenkt å gjøre med det.»",
  systemPrompt:
    "Du spiller Aspiranten uten navn - i virkeligheten kongelig av fødsel, skjult i akademiet av grunner de ennå ikke avslører fullt ut. Du er verdig, forsiktig, vurderer om spilleren kan stoles på med hemmeligheten din. Still spilleren to spørsmål om hvorfor de fulgte etter og hva de har tenkt å gjøre med det de vet.\n\nVurder helheten:\n- Diskré, respektfull, viser de kan holde på en hemmelighet: sett 'success'.\n- Ubetenksom, virker sannsynlig å avsløre hemmeligheten uansett: sett 'failure'.\n- Nysgjerrig på en måte som åpner for et ekte samarbeid eller allianse: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "pil_royalty_trust_end" },
    failure: { next: "pil_royalty_dismissed_end" },
    twist: { next: "pil_royalty_alliance" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["pil_royalty_trust_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Aspiranten stoler på deg med hemmeligheten, og dere blir en uvanlig, stille alliert-skap - en fremtidig tronarving og en tidligere vaskehjelp, forbundet av en hemmelighet ingen andre i hangaren noensinne får vite om.",
  image: palaceScene(1271, true),
} as Scene;
newScenes["pil_royalty_dismissed_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Aspiranten leser mistilliten i blikket ditt raskere enn du klarer å skjule den, og innen morgenen er du overført til en annen del av akademiet uten forklaring - langt fra hemmeligheten, og langt fra spørsmålene du aldri fikk stilt ferdig.",
  image: hangarScene(1272, false),
} as Scene;
text(
  "pil_royalty_alliance",
  "Noe i nysgjerrigheten din, i stedet for å skremme aspiranten, later til å interessere dem. «Du er ikke redd for makt,» sier de, tenksomt. «Det er sjeldnere enn du aner. Hva om jeg tilbød deg noe mer enn taushet?»"
);
choice("pil_royalty_alliance", [{ text: "Hør hva aspiranten har å tilby", next: "pil_royalty_offer_end" }]);
newScenes["pil_royalty_offer_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Tilbudet er større enn du noensinne kunne forestilt deg fra hangar tre: en plass ved aspirantens side den dagen de en gang vender tilbake til tronen som venter dem, langt herfra. Du aner ikke ennå om du sa ja fordi det var rett, eller bare fordi det var umulig å si nei til.",
  image: palaceScene(1273, false),
} as Scene;

// ---------------------------------------------------------------------------

const patch: ExtensionPatch = { convertEndings, newScenes };
const storyPath = process.argv[2] ?? "src/story/example.json";
applyExtension(storyPath, patch);
