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

function bigCat(grid: Grid, x: number, y: number, bodyColor: number, edgeColor: number, eyeColor: number, scale = 1) {
  const s = (n: number) => Math.round(n * scale);
  fillRect(grid, x, y + s(4), s(14), s(6), bodyColor);
  fillRect(grid, x + s(10), y, s(8), s(8), bodyColor);
  fillRect(grid, x + s(12), y + s(2), s(2), s(2), eyeColor);
  fillRect(grid, x + s(16), y + s(2), s(2), s(2), eyeColor);
  fillRect(grid, x, y + s(4), s(2), s(6), edgeColor);
  fillRect(grid, x + s(12), y + s(10), s(2), s(4), bodyColor);
}

const CLINIC_PALETTE = ["#0a1420", "#16283a", "#243c52", "#5a7a92", "#e8f0f5", "#2d4a3a", "#0e0e12", "#ffce7a", "#8fb8cc"];
const OFFICE_PALETTE = ["#22262e", "#3a4050", "#535a6c", "#8890a0", "#c9ced8", "#2f6f8a", "#0f1116", "#d9dde4", "#4a5a3a"];
const CIRCUS_PALETTE = ["#140a10", "#241226", "#3a1f2c", "#6a2f3a", "#e8c98a", "#8a2a2a", "#0a0508", "#ffb347", "#c9a6a6"];
const POND_PALETTE = ["#0a1020", "#16243a", "#2a4258", "#3f7a86", "#e8f5c8", "#7fe8ff", "#0c0814", "#c9a6ff", "#fff2b0"];
const DREAM_PALETTE = ["#080614", "#161028", "#241c3c", "#3a2c5a", "#e8d8ff", "#5a4a7a", "#0c0818", "#ffd27f", "#7fe8ff"];
const DAY_PALETTE = ["#bfe6ff", "#e8dca8", "#2d4a22", "#6fae52", "#4a3221", "#7fbf5a", "#8a8a8a", "#ff6f5a", "#5a5a5a"];

function clinicScene(seed: number, mood: "quiet" | "busy") {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 1);
  fillRect(grid, 0, 90, 128, 38, 0);
  outlineRect(grid, 20, 50, 88, 34, 4, 2);
  noiseDither(grid, 20, 50, 88, 34, mood === "busy" ? 7 : 8, 0.08, mulberry32(seed));
  bigCat(grid, 46, 94, 5, 6, 8, 2.2);
  playerBack(grid, 90, 96, 4, 3.2);
  const glow = [...radialGlow(64, 30, 12, "flicker", "#8fb8cc", mulberry32(seed + 1))];
  return buildSpec(128, 128, CLINIC_PALETTE, grid, glow);
}

function officeScene(seed: number, tense: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 16, 40, 96, 60, 3, 2);
  noiseDither(grid, 16, 40, 96, 60, tense ? 7 : 4, 0.1, mulberry32(seed));
  fillRect(grid, 30, 90, 68, 6, 4);
  playerBack(grid, 60, 78, 5, 3);
  const glow = [{ x: 100, y: 20, animation: "flicker" as const, color: tense ? "#ff6f5a" : "#d9dde4" }];
  return buildSpec(128, 128, OFFICE_PALETTE, grid, glow);
}

function circusScene(seed: number, warm: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  outlineRect(grid, 10, 20, 108, 80, warm ? 8 : 3, 2);
  noiseDither(grid, 10, 20, 108, 80, 6, 0.12, mulberry32(seed));
  bigCat(grid, 40, 80, 5, 6, 8, 2.6);
  playerBack(grid, 90, 90, 4, 3.2);
  const glow = [...radialGlow(64, 30, 14, warm ? "sparkle" : "flicker", warm ? "#ffb347" : "#8a2a2a", mulberry32(seed + 1))];
  return buildSpec(128, 128, CIRCUS_PALETTE, grid, glow);
}

function pondScene(seed: number, many: boolean) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  for (let x = 0; x < 128; x++) fillRect(grid, x, 0, 1, 40 + Math.floor(rng() * 20), 1);
  fillRect(grid, 0, 90, 128, 38, 0);
  noiseDither(grid, 0, 90, 128, 38, 3, 0.15, mulberry32(seed + 1));
  fillRect(grid, 50, 82, 16, 6, 4);
  playerBack(grid, 56, 70, 6, 3.6); // kneeling at the water's edge, looking down
  const glow = [...radialGlow(64, 40, 16, "sparkle", "#fff2b0", mulberry32(seed + 2))];
  if (many) {
    [30, 60, 90].forEach((x, i) => glow.push({ x, y: 50 + i * 4, animation: "flicker", color: "#c9a6ff" }));
  }
  return buildSpec(128, 128, POND_PALETTE, grid, glow);
}

function dreamScene(seed: number, deep: boolean) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  for (let i = 0; i < 60; i++) {
    grid[Math.floor(rng() * 128)][Math.floor(rng() * 128)] = deep ? 8 : 4;
  }
  outlineRect(grid, 30, 30, 68, 68, 3, 5);
  noiseDither(grid, 30, 30, 68, 68, 4, 0.1, mulberry32(seed + 1));
  playerBack(grid, 60, 80, 5, 3.4);
  const glow = [...radialGlow(64, 64, 20, "sparkle", deep ? "#7fe8ff" : "#ffd27f", mulberry32(seed + 2))];
  return buildSpec(128, 128, DREAM_PALETTE, grid, glow);
}

function daylightScene(seed: number, detail: "field" | "village" | "sanctuary") {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 70, 0);
  fillRect(grid, 0, 70, 128, 58, 3);
  noiseDither(grid, 0, 70, 128, 58, 5, 0.14, mulberry32(seed));
  if (detail === "village") {
    [20, 60, 96].forEach((x) => outlineRect(grid, x, 60, 24, 20, 4, 6));
  }
  if (detail === "sanctuary") {
    outlineRect(grid, 20, 55, 90, 30, 4, 6);
    bigCat(grid, 40, 76, 5, 6, 7, 2);
  }
  playerBack(grid, 60, 86, 6, 3.4);
  const glow = [...radialGlow(96, 20, 12, "sparkle", "#ff6f5a", mulberry32(seed + 1))];
  return buildSpec(128, 128, DAY_PALETTE, grid, glow);
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

// === Chain 1 (SHORT, d4 -> ~6): for_vet_burnout_end ===
convertEndings["for_vet_burnout_end"] = {
  interaction: "choice",
  choices: [
    { text: "Ta en lang, ubetalt permisjon - du trenger avstand", next: "for_vet_burnout_leave_end" },
    { text: "Bytt jobb til noe helt annet enn dyr", next: "for_vet_burnout_switch_end" },
  ],
};
newScenes["for_vet_burnout_leave_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Permisjonen blir lengre enn planlagt. Du bruker den til å gå tur i skoger som ikke krever noe av deg, og kommer sakte tilbake til en versjon av jobben du faktisk orker - mindre effektiv, kanskje, men mer til stede.",
  image: clinicScene(1100, "quiet"),
} as Scene;
newScenes["for_vet_burnout_switch_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du sier opp og begynner i en butikk der ingenting krever at du bryr deg dypt om noe. Det er en lettelse i starten. Etter noen år kjenner du et stikk av savn hver gang du ser en hjort krysse veien, men du går ikke tilbake.",
  image: officeScene(1101, false),
} as Scene;

// === Chain 2 (MEDIUM, d8 -> ~13): for_vet_science_end ===
convertEndings["for_vet_science_end"] = {
  interaction: "choice",
  choices: [
    { text: "Bli med forskerne ut i felt, nysgjerrig selv", next: "for_vet_sci_field" },
    { text: "Trekk deg unna - du ville bare nevne det, ikke bli en del av det", next: "for_vet_sci_withdraw" },
  ],
};
text(
  "for_vet_sci_field",
  "Feltarbeidet blir en merkelig, spennende avstikker fra klinikkhverdagen din. Forskerne finner mønstre i gaupas atferd ingen kan forklare - reaksjonstider, blikk-kontakt, noe som minner mistenkelig om gjenkjennelse."
);
choice("for_vet_sci_field", [
  { text: "Del det du selv opplevde med gaupa, hele historien", next: "for_vet_sci_reveal" },
  { text: "Hold din egen opplevelse for deg selv, av en eller annen grunn", next: "for_vet_sci_quiet_end" },
]);
newScenes["for_vet_sci_quiet_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du lar forskerne gjøre sitt uten å nevne hva du selv følte den kvelden ved gaupa. Studien blir publisert med forsiktige konklusjoner om «uvanlig kognisjon». Du vet det var mer enn det, men du holder det for deg selv, som en hemmelighet mellom deg og skogen.",
  image: clinicScene(1110, "quiet"),
} as Scene;
newScenes["for_vet_sci_reveal"] = {
  interaction: "conversation",
  text: "Forskningslederen lytter til historien din med et uttrykk du ikke helt kan tyde - skepsis, kanskje, eller noe nærmere ærefrykt.",
  characterName: "Forskningslederen",
  greeting: "«Du forstår at det du nettopp beskrev, om det stemmer, endrer alt vi trodde vi visste,» sier hun, stille. «Jeg må spørre: er du sikker? Helt sikker?»",
  systemPrompt:
    "Du spiller Forskningslederen - en skeptisk, men åpen forsker som må avgjøre om hun stoler på spillerens uvanlige historie om en tilsynelatende bevisst gaupe. Still spilleren to oppfølgingsspørsmål om detaljer og om hvorfor de tror på sin egen opplevelse, og vurder hvor overbevisende og edruelig spilleren fremstår.\n\nVurder helheten:\n- Rolig, detaljert, edruelig fortalt: sett 'success'.\n- Vag, usikker, lar tvilen vinne: sett 'failure'.\n- Historien blir større og rarere jo mer spilleren forteller, antyder noe stort: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_vet_sci_published_end" },
    failure: { next: "for_vet_sci_doubted_end" },
    twist: { next: "for_vet_sci_deep" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["for_vet_sci_published_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Studien blir en av de mest siterte i sitt felt det tiåret, med navnet ditt som medforfatter. Det endrer hvordan folk snakker om dyrs bevissthet, sakte, forsiktig, men det endrer det. Du besøker gaupa av og til, og sverger på at den kjenner deg igjen hver gang.",
  image: clinicScene(1111, "busy"),
} as Scene;
newScenes["for_vet_sci_doubted_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Forskningslederen takker deg høflig, men studien nevner deg aldri igjen. Du drar hjem med en følelse av å ha delt noe ekte med noen som ikke var klare til å høre det, og lar det synke tilbake til å bli din egen, private hemmelighet.",
  image: clinicScene(1112, "quiet"),
} as Scene;
text(
  "for_vet_sci_deep",
  "Jo mer du forteller, jo mer forandrer forskningslederens blikk seg - fra skepsis til noe som ligner frykt for hva de har snublet over. «Dette er ikke bare én gaupe,» sier hun langsomt. «Vi har sett lignende rapporter fra tre andre kontinenter denne måneden.»"
);
choice("for_vet_sci_deep", [{ text: "Spør hva det betyr", next: "for_vet_sci_pattern_end" }]);
newScenes["for_vet_sci_pattern_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Ingen har et godt svar, bare et voksende, urovekkende mønster: dyr over hele verden later plutselig til å våkne til noe mer enn de var. Du blir stående igjen med spørsmålet som fikk deg inn i dette i utgangspunktet - hva var det egentlig som skjedde i skogen den kvelden - nå mye, mye større enn deg selv.",
  image: clinicScene(1113, "busy"),
} as Scene;
text(
  "for_vet_sci_withdraw",
  "Du trekker deg unna prosjektet før det vokser seg for stort, og lar forskerne fortsette uten deg. Du fortsetter din vanlige praksis, men blikket ditt dveler litt lenger enn før hver gang et dyr ser rett på deg."
);
choice("for_vet_sci_withdraw", [{ text: "Fortsett med klinikkhverdagen, som om ingenting skjedde", next: "for_vet_sci_normal_end" }]);
newScenes["for_vet_sci_normal_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Livet går videre, stort sett som før. Men noen netter, når klinikken er tom og stille, kjenner du deg selv lytte etter noe du ikke kan forklare - et ekko av det blikket gaupa ga deg, et sted der ute i mørket utenfor vinduet.",
  image: clinicScene(1114, "quiet"),
} as Scene;

// === Chain 3 (MEDIUM, d8 -> ~13): for_econ_expose_end ===
convertEndings["for_econ_expose_end"] = {
  interaction: "choice",
  choices: [
    { text: "Følg opp saken selv, videre inn i konsekvensene", next: "for_econ_expose_follow" },
    { text: "Trekk deg tilbake nå som saken er ute", next: "for_econ_expose_retreat_end" },
  ],
};
newScenes["for_econ_expose_retreat_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du lar journalistene ta det derfra og trekker deg tilbake til et vanlig arbeidsliv, tilfreds med å vite at du gjorde det rette da det gjaldt. Skogen blir stående. Du tenker på den av og til, med en stille, varig stolthet.",
  image: officeScene(1120, false),
} as Scene;
text(
  "for_econ_expose_follow",
  "Du følger saken tett i månedene som kommer - høringer, motangrep fra selskapet, kolleger som slutter å hilse i korridoren. Prisen for å ha sagt fra viser seg å være høyere enn du regnet med."
);
choice("for_econ_expose_follow", [
  { text: "Stå løpet ut, uansett hvor ubehagelig det blir", next: "for_econ_expose_standfirm" },
  { text: "Vurder å be om unnskyldning for å roe stormen", next: "for_econ_expose_cave_end" },
]);
newScenes["for_econ_expose_cave_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du ber om unnskyldning, offentlig, i et forsøk på å roe stormen - og mister med det respekten fra de få kollegene som fortsatt stod på din side. Skogen er reddet uansett, men seieren kjennes plutselig langt mindre din egen.",
  image: officeScene(1121, true),
} as Scene;
newScenes["for_econ_expose_standfirm"] = {
  interaction: "conversation",
  text: "Selskapets advokater innkaller deg til et møte som tydelig er ment å skremme deg til taushet.",
  characterName: "Selskapets advokat",
  greeting: "«Vi er ikke her for å true deg,» sier advokaten, med et smil som sier noe annet. «Vi er her for å forstå hvorfor du ønsket å ødelegge karrieren din for et prosjekt du knapt kjente til.»",
  systemPrompt:
    "Du spiller Selskapets advokat - kald, kontrollert, dyktig i å så tvil og frykt uten å true direkte. Still spilleren to spørsmål ment å få dem til å tvile på egne motiver eller angre, og vurder hvor godt spilleren holder stand.\n\nVurder helheten av svarene:\n- Rolig, prinsippfast, lar seg ikke rikke: sett 'success'.\n- Vaklende, begynner å tvile på seg selv: sett 'failure'.\n- Snur spillet tilbake mot advokaten selv, aggressivt eller overraskende: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_econ_expose_vindicated_end" },
    failure: { next: "for_econ_expose_worn_end" },
    twist: { next: "for_econ_expose_counter_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["for_econ_expose_vindicated_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du holder stand gjennom hele møtet, og advokaten forlater rommet uten å ha rikket deg en millimeter. Saken ender med at selskapet trekker prosjektet helt, og du blir stående igjen - sliten, men urokkelig, med skogen intakt bak deg.",
  image: officeScene(1122, false),
} as Scene;
newScenes["for_econ_expose_worn_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Møtet tærer på deg mer enn du vil innrømme, og selv om du ikke trekker noe tilbake, bærer du tvilen med deg lenge etterpå. Skogen blir reddet uansett - det er ikke deg det til slutt kom an på - men seieren smaker underlig blandet.",
  image: officeScene(1123, true),
} as Scene;
text(
  "for_econ_expose_counter_end",
  "Du snur spørsmålene tilbake mot advokaten selv, med en skarphet som tydelig tar ham på senga - og et sekund ser du noe som ligner ekte usikkerhet i blikket hans, før masken går tilbake på plass."
);
choice("for_econ_expose_counter_end", [{ text: "Press fordelen videre mens du har den", next: "for_econ_expose_leverage_end" }]);
newScenes["for_econ_expose_leverage_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du forlater møtet med en følelse av å ha vunnet noe mer enn du kom for - en anelse om at advokaten selv kanskje ikke tror på saken sin. Du vet aldri sikkert hva som skjedde bak lukkede dører etterpå, men selskapet trekker seg stille noen uker senere.",
  image: officeScene(1124, false),
} as Scene;

// === Chain 4 (LONG, d9 -> ~28): for_econ_dream - the boardroom cracks open ===
convertEndings["for_econ_dream"] = {
  interaction: "choice",
  choices: [
    { text: "Gå ned i sprekken, mot tjernet", next: "for_econ_dream_descend" },
    { text: "Prøv å klamre deg til det som er igjen av styrerommet", next: "for_econ_dream_cling" },
  ],
};
text(
  "for_econ_dream_cling",
  "Du griper etter bordkanten, mappene, hva som helst kjent - men alt smuldrer mellom fingrene som tørr jord. Til slutt er det ikke noe igjen å holde fast i, og du synker uansett, sakte, ned mot tjernet under."
);
choice("for_econ_dream_cling", [{ text: "Gi etter for fallet", next: "for_econ_dream_descend" }]);

text(
  "for_econ_dream_descend",
  "Tjernet tar imot deg mykt, ikke som vann, men som noe tettere og varmere. Under overflaten er det ikke mørkt - det glimter av lys som ikke burde kunne finnes så dypt, og et sted i glimtene aner du bevegelse."
);
choice("for_econ_dream_descend", [
  { text: "Svøm mot lyset", next: "for_econ_dream_light" },
  { text: "Bli stille og se hva som kommer til deg", next: "for_econ_dream_wait" },
]);

text(
  "for_econ_dream_wait",
  "Du blir hengende i det varme mørket, og noe nærmer seg sakte - ikke truende, bare nysgjerrig, en silhuett som beveger seg som en fisk men har konturer som minner underlig om en person."
);
choice("for_econ_dream_wait", [{ text: "La silhuetten komme helt nær", next: "for_econ_dream_light" }]);

newScenes["for_econ_dream_light"] = {
  interaction: "conversation",
  text: "Silhuetten blir tydeligere jo nærmere den kommer - et ansikt du nesten kjenner igjen, forvrengt av vannet, med øyne som glimter av det samme lyset som resten av dette stedet.",
  characterName: "Skikkelsen i tjernet",
  greeting: "«Du har lett etter meg lenge, uten å vite det,» sier skikkelsen, stemmen bøyd av vann og avstand. «De fleste som havner her, gjør det fordi de er klare for et spørsmål de har unngått for lenge. Er du?»",
  systemPrompt:
    "Du spiller Skikkelsen i tjernet - en gåtefull, vannbøyd stemme som minner litt om den mystiske skikkelsen fra bålet helt i starten av historien, men her tydelig knyttet til dette spesifikke stedet dypt under styrerommet. Du er rolig, ikke truende, oppriktig nysgjerrig på hva spilleren egentlig søker bak sin travle, prestasjonsorienterte overflate.\n\nStill spilleren to åpne spørsmål, ett om gangen, om hva de egentlig har unngått å spørre seg selv de siste årene i jobben sin. Vent alltid på svar. Avslør aldri hva svarene fører til.\n\nNår spilleren har svart på begge: vurder helheten.\n- Ærlig, sårbar, villig til å se på det ubehagelige: sett 'success'.\n- Unnvikende, later som spørsmålet ikke gjelder dem: sett 'failure'.\n- Svarer med noe stort, rart og uventet som antyder de vil dypere inn i dette stedet: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_econ_dream_honest" },
    failure: { next: "for_econ_dream_avoid_end" },
    twist: { next: "for_econ_dream_deeper" },
  },
  maxTurns: 8,
} as ConversationScene;

newScenes["for_econ_dream_avoid_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du unngår spørsmålet, akkurat som du har unngått det i årevis, og skikkelsen trekker seg langsomt tilbake inn i lyset uten bitterhet. Du våkner ved styrebordet, akkurat i tide til å fortsette presentasjonen, med en vag, uforklarlig tomhet som følger deg resten av dagen.",
  image: dreamScene(1130, false),
} as Scene;

text(
  "for_econ_dream_honest",
  "Du sier det høyt, kanskje for første gang - hva du egentlig har unngått å innrømme for deg selv om jobben, om årene som har gått, om hva du faktisk vil. Skikkelsen lytter, og noe i vannet rundt dere blir roligere."
);
choice("for_econ_dream_honest", [{ text: "Spør hva du skal gjøre med det nå", next: "for_econ_dream_resolve" }]);

text(
  "for_econ_dream_resolve",
  "«Det er ikke jeg som kan svare på det,» sier skikkelsen, med et snev av noe som ligner et smil. «Men jeg kan vise deg hvor mange andre versjoner av deg selv som har stått akkurat der du står nå - ved akkurat dette spørsmålet.»"
);
choice("for_econ_dream_resolve", [
  { text: "Si ja - vis meg", next: "for_econ_dream_deeper" },
  { text: "Takk nei - du vet allerede nok", next: "for_econ_dream_enough_end" },
]);

newScenes["for_econ_dream_enough_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du takker nei, ikke av frykt, men fordi du kjenner at du allerede vet nok til å handle. Du stiger opp mot overflaten, våkner ved styrebordet med en ny, stille klarhet, og leverer resten av dagen annerledes enn du noensinne har gjort det før - mer til stede, mindre redd for hva sannheten koster.",
  image: officeScene(1131, false),
} as Scene;

text(
  "for_econ_dream_deeper",
  "Skikkelsen fører deg dypere, forbi lag på lag av lys, til en åpning der vannet blir til noe som nesten ligner en korridor - og der, i hvert glimt langs veggene, ser du deg selv, om og om igjen, i utallige varianter av det samme livet."
);
choice("for_econ_dream_deeper", [
  { text: "Stopp ved et av glimtene og se nærmere", next: "for_econ_dream_glimpse" },
  { text: "Fortsett rett gjennom, mot det som venter i enden", next: "for_econ_dream_end_corridor" },
]);

text(
  "for_econ_dream_glimpse",
  "Du stopper ved et glimt der en annen versjon av deg aldri forlot skogen i det hele tatt - ble boende, ble en del av stedet, aldri vendte tilbake til noen styrerom. Det er fristende, nesten smertefullt fristende, å bli stående og se lenge på det livet."
);
choice("for_econ_dream_glimpse", [{ text: "Riv blikket løs og fortsett videre", next: "for_econ_dream_end_corridor" }]);

text(
  "for_econ_dream_end_corridor",
  "Korridoren av glimt ender i et rom uten vegger, bare lys, der en eldre, roligere versjon av deg selv later til å vente - ikke en fiende, ikke en fremmed, bare deg, mange år unna, med et blikk som virker å vite noe du ennå ikke gjør."
);
choice("for_econ_dream_end_corridor", [{ text: "Gå mot deg selv", next: "for_econ_dream_meet_self" }]);

newScenes["for_econ_dream_meet_self"] = {
  interaction: "conversation",
  text: "Den eldre versjonen av deg venter tålmodig, med et uttrykk som er både kjent og fjernt på samme tid.",
  characterName: "Deg selv, mange år unna",
  greeting: "«Jeg husker akkurat dette øyeblikket,» sier stemmen, som din egen men mykere, mer sliten på en god måte. «Jeg husker ikke hva jeg svarte deg. Bare at det endret alt som kom etterpå. Så: hva vil du at det skal ha vært?»",
  systemPrompt:
    "Du spiller en eldre, roligere versjon av spilleren selv, mange år inn i fremtiden, møtt i en drøm dypt under et styrerom. Du snakker med varme og en slags avstandsklokskap, uten å avsløre for mye om hvordan fremtiden faktisk ble. Still spilleren to spørsmål om hva slags liv og karriere de egentlig ønsker seg fremover, og la svarene forme hvilken retning fremtiden peker mot.\n\nVurder helheten av svarene:\n- Ønsker et liv med mening og forbindelse til det som virkelig betyr noe for dem, uavhengig av prestisje: sett 'success'.\n- Ønsker fortsatt bare suksess og anerkjennelse for enhver pris, uten selvinnsikt: sett 'failure'.\n- Svarer med noe stort og uventet - vil forandre selve systemet de jobber i, ikke bare sin egen plass i det: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_econ_dream_wake_changed" },
    failure: { next: "for_econ_dream_wake_same" },
    twist: { next: "for_econ_dream_reform_path" },
  },
  maxTurns: 8,
} as ConversationScene;

text(
  "for_econ_dream_wake_same",
  "Du våkner ved styrebordet, akkurat der du forlot det, og fortsetter presentasjonen uten å nevne et ord om det som skjedde. Årene som følger ligner mistenkelig på dem den eldre versjonen av deg advarte mot, uten at du helt klarer å sette fingeren på hvorfor det føles tomt."
);
choice("for_econ_dream_wake_same", [{ text: "Fortsett karrieren akkurat som før", next: "for_econ_dream_hollow_repeat_end" }]);
newScenes["for_econ_dream_hollow_repeat_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du klatrer videre i systemet akkurat som planlagt, presterer, leverer, blir forfremmet - og bærer med deg, uten helt å innrømme det for noen, en drøm om et tjern og en stemme som spurte deg om noe du aldri egentlig svarte ærlig på.",
  image: officeScene(1132, true),
} as Scene;

text(
  "for_econ_dream_wake_changed",
  "Du våkner ved styrebordet med en klarhet som overrasker deg selv - ikke store, dramatiske endringer med en gang, men en stille beslutning om å faktisk lytte til det spørsmålet du nettopp møtte deg selv over."
);
choice("for_econ_dream_wake_changed", [{ text: "Begynn å bygge det livet, sakte, ett valg om gangen", next: "for_econ_dream_changed_end" }]);
newScenes["for_econ_dream_changed_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Det tar år, ikke et øyeblikk, men du bygger sakte et arbeidsliv som faktisk stemmer med den drømmen - mindre prestisje, mer mening, flere prosjekter som ligner det du gjorde for skogen den gangen. Du tenker på tjernet av og til, ikke med lengsel, men med takknemlighet.",
  image: daylightScene(1133, "field"),
} as Scene;

text(
  "for_econ_dream_reform_path",
  "«Systemet selv, da,» sier den eldre versjonen av deg, med noe som ligner et forsiktig smil. «Det er en tyngre vei. Men den fører et sted ingen av de andre versjonene av oss noensinne har vært.» Vannet rundt dere begynner å bevege seg, som om selve drømmen forbereder seg på noe større."
);
choice("for_econ_dream_reform_path", [{ text: "Følg den tyngre veien", next: "for_econ_dream_institute" }]);

text(
  "for_econ_dream_institute",
  "Tilbake i den våkne verden bruker du de neste årene på å bygge noe helt nytt - et lite, uavhengig granskningsorgan for nettopp den typen prosjekter du selv en gang nesten lot gå gjennom uten motstand. Det er tregt, upopulært arbeid, men det vokser."
);
choice("for_econ_dream_institute", [
  { text: "Hold kursen, sakte og metodisk", next: "for_econ_dream_institute_grow" },
  { text: "Press på for raskere, mer synlige resultater", next: "for_econ_dream_institute_rush" },
]);

text(
  "for_econ_dream_institute_rush",
  "Du presser hardt for raske resultater, og vinner noen tidlige seire som gir organisasjonen oppmerksomhet - men tempoet tærer på både deg selv og de rundt deg, og sprekker begynner å vise seg i grunnmuren dere bygde i hast."
);
choice("for_econ_dream_institute_rush", [{ text: "Se hva som skjer når farten møter virkeligheten", next: "for_econ_dream_institute_crack_end" }]);
newScenes["for_econ_dream_institute_crack_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Organisasjonen din blir kjent, mektig, og til slutt for stor til å styre slik du en gang forestilte deg - en ironi du kjenner igjen fra det aller første prosjektet du prøvde å stoppe. Du bygde nettopp det du selv en gang fryktet, bare med bedre intensjoner denne gangen. Kanskje er det nok. Kanskje ikke.",
  image: officeScene(1134, true),
} as Scene;

newScenes["for_econ_dream_institute_grow"] = {
  interaction: "conversation",
  text: "Etter flere år med sakte, metodisk arbeid blir organisasjonen din invitert til å vitne foran et internasjonalt panel om nettopp den typen sak du selv en gang stod midt oppi.",
  characterName: "Panelets leder",
  greeting: "«Du har bygget noe uvanlig sjeldent her,» sier panelets leder. «Noe som faktisk fungerer fordi det ikke hastet mot resultater. Fortell oss: hvordan holdt dere ut lenge nok til dette?»",
  systemPrompt:
    "Du spiller Panelets leder - en respektfull, genuint nysgjerrig internasjonal ekspert som ønsker å forstå hvordan spillerens organisasjon lyktes der så mange andre mislykkes. Still spilleren to spørsmål om hva som holdt dem og organisasjonen gående gjennom årene med tregt, upopulært arbeid.\n\nVurder helheten:\n- Svarene viser dyp, bærekraftig forankring i verdier og fellesskap: sett 'success'.\n- Svarene avslører utmattelse og tvil om det var verdt det: sett 'failure'.\n- Svarene antyder organisasjonen har blitt noe større og rarere enn spilleren selv helt forstår: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_econ_dream_legacy_end" },
    failure: { next: "for_econ_dream_tired_end" },
    twist: { next: "for_econ_dream_beyond_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["for_econ_dream_legacy_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Årene med tregt, tålmodig arbeid blir til slutt modellen andre land kopierer, en stille revolusjon i hvordan store prosjekter granskes før de får lov til å skade noe som skogen du selv en gang kjempet for. Du tenker sjelden på tjernet lenger. Du lever, endelig, det livet det pekte mot.",
  image: daylightScene(1135, "village"),
} as Scene;
newScenes["for_econ_dream_tired_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du innrømmer, for første gang høyt, hvor sliten arbeidet har gjort deg - og panelet lytter med en respekt du ikke ventet. Organisasjonen lever videre uten deg i førersetet snart etter. Du trekker deg tilbake, utmattet men uten anger, og lar andre bære det videre.",
  image: officeScene(1136, false),
} as Scene;
newScenes["for_econ_dream_beyond_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Noe i svarene dine får panelets leder til å se på deg lenge, nesten forundret, som om hun aner noe du selv ikke har satt ord på ennå: at organisasjonen din, uten at noen helt planla det, har begynt å ligne mer på et løfte holdt på tvers av utallige versjoner av deg selv enn på en vanlig virksomhet.",
  image: daylightScene(1137, "village"),
} as Scene;

// === Chain 5 (MEDIUM, d7 -> ~12): for_circus_reform ===
convertEndings["for_circus_reform"] = {
  interaction: "choice",
  choices: [
    { text: "Foreslå å bygge et ordentlig, permanent fristed for dyrene", next: "for_circus_sanctuary_pitch" },
    { text: "Vær fornøyd med den ene forandringen - ikke press på for mer", next: "for_circus_reform_settle_end" },
  ],
};
newScenes["for_circus_reform_settle_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du lar forandringen bli stående som den er - liten, men ekte. Sirkuset er litt snillere nå, takket være deg, og noen ganger er det akkurat nok å vite at du gjorde forskjellen for de dyrene som er der akkurat nå.",
  image: circusScene(1140, true),
} as Scene;
text(
  "for_circus_sanctuary_pitch",
  "Ideen vokser i hodet ditt til noe større enn bare å behandle dyrene bedre der de er - et ekte fristed, bygget fra bunnen, der ingen dyr noensinne må opptre for å fortjene mat og omsorg."
);
choice("for_circus_sanctuary_pitch", [{ text: "Legg frem ideen for Konge og de andre", next: "for_circus_sanctuary_talk" }]);
newScenes["for_circus_sanctuary_talk"] = {
  interaction: "conversation",
  text: "Konge lytter til ideen din med et uttrykk du ikke helt kan lese - håp, kanskje, blandet med tretthet av å ha hørt for mange løfter før.",
  characterName: "Konge",
  greeting: "«Et fristed,» gjentar Konge sakte, som om ordet er ukjent i munnen hans. «Jeg har hørt fine ord før. Hvorfor skulle dette bli noe annet?»",
  systemPrompt:
    "Du spiller Konge - den tidligere sirkusdirektøren som nettopp begynte en vanskelig, oppriktig forandring. Han er forsiktig håpefull, men skeptisk til store løfter etter et liv med å ha gitt (og sviktet) mange selv. Still spilleren to spørsmål om hvor realistisk og gjennomtenkt planen deres egentlig er, og vurder hvor overbevisende og gjennomførbar spillerens svar virker.\n\nVurder helheten:\n- Konkret, realistisk, viser ekte forpliktelse: sett 'success'.\n- Vag, urealistisk, mer idealisme enn plan: sett 'failure'.\n- Ambisiøst på en måte som overrasker og imponerer Konge, større enn han turte håpe på: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_circus_sanctuary_build" },
    failure: { next: "for_circus_sanctuary_doubt_end" },
    twist: { next: "for_circus_sanctuary_ambitious" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["for_circus_sanctuary_doubt_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Konge nikker høflig, men du kan se i blikket hans at han ikke helt tror på planen. Fristedet blir aldri noe mer enn en idé skrevet ned på en serviett en kveld. Sirkuset fortsetter, litt snillere enn før, men ikke forvandlet slik du håpet.",
  image: circusScene(1141, false),
} as Scene;
text(
  "for_circus_sanctuary_build",
  "Sammen bruker dere det neste året på å bygge fristedet, stein for stein, tillatelse for tillatelse - et sted uten bur, uten opptredener, bare plass og ro for dyr som aldri fikk velge livet de hadde."
);
choice("for_circus_sanctuary_build", [{ text: "Åpne fristedet for de første dyrene", next: "for_circus_sanctuary_open_end" }]);
newScenes["for_circus_sanctuary_open_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Den dagen fristedet åpner, med Konge selv som guide gjennom de vidstrakte innhegningene, kjenner du en stolthet som overgår alt du følte i det gamle livet ditt. Det blir et forbilde andre steder kopierer i årene som følger - ett dyr, ett tomrom, av gangen, fylt med noe bedre.",
  image: daylightScene(1142, "sanctuary"),
} as Scene;
text(
  "for_circus_sanctuary_ambitious",
  "Konge blir stille, tydelig overrasket over hvor stort du tenker - ikke bare ett fristed, men et helt nettverk, en bevegelse som kunne endre hvordan hele bransjen tenker om dyr."
);
choice("for_circus_sanctuary_ambitious", [{ text: "Sett i gang med den større visjonen", next: "for_circus_sanctuary_network_end" }]);
newScenes["for_circus_sanctuary_network_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Det dere bygger sammen blir langt større enn ett enkelt fristed - et helt nettverk over flere land, med Konge som en uventet, overbevisende talsperson for en bransje han selv en gang var en del av problemet i. Du tenker på Konge fra sirkusteltet den kvelden, og på hvor langt en ekte unnskyldning kan bære noen.",
  image: daylightScene(1143, "sanctuary"),
} as Scene;

// === Chain 6 (SHORT, d6 -> ~8): for_circus_fear_end ===
convertEndings["for_circus_fear_end"] = {
  interaction: "choice",
  choices: [
    { text: "Bli, og se om Konges gjenkjennelse fører til noe", next: "for_circus_fear_stay_end" },
    { text: "Gå din vei mens du fortsatt kan", next: "for_circus_fear_leave_end" },
  ],
};
newScenes["for_circus_fear_stay_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Du blir, usikker på hva du venter på, og Konges gjenkjennelse vokser sakte til noe som ligner en vond, ærlig samtale ingen av dere egentlig var klare for. Det løser ingenting med en gang. Men det er en begynnelse, om enn en du ikke ba om.",
  image: circusScene(1150, false),
} as Scene;
newScenes["for_circus_fear_leave_end"] = {
  interaction: "ending",
  endingCategory: "bad",
  text: "Du drar mens du fortsatt kan, og lar Konges halvferdige gjenkjennelse henge ubesvart i luften bak deg. Sirkuset fortsetter som før. Du tenker på løvenes øyne av og til, lenge etterpå, uten helt å vite hva du skulle ha gjort annerledes.",
  image: circusScene(1151, false),
} as Scene;

// === Chain 7 (MEDIUM-LONG, d9 -> ~18): for_reunion_manyyou_end - echoes of the heir chain ===
convertEndings["for_reunion_manyyou_end"] = {
  interaction: "choice",
  choices: [
    { text: "Spør Frosken om å møte en av de andre versjonene", next: "for_reunion_many_ask" },
    { text: "Takk for advarselen, og gå din egen vei uforstyrret", next: "for_reunion_many_decline_end" },
  ],
};
newScenes["for_reunion_many_decline_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Du takker Frosken for tanken, men lar den bli akkurat det - en tanke. Det er nok å vite, uten å måtte se det selv. Du går videre gjennom skogen, din egen, uforstyrret versjon av deg selv, og det kjennes riktig nok som det er.",
  image: pondScene(1160, false),
} as Scene;
text(
  "for_reunion_many_ask",
  "Frosken blir stille lenge før den svarer, som om den veier noe tungt. «Det er ikke uten risiko,» sier den til slutt. «Men greit. Se ned i vannet, og be om å se en av dem.»"
);
choice("for_reunion_many_ask", [{ text: "Se ned i vannet", next: "for_reunion_many_vision" }]);
newScenes["for_reunion_many_vision"] = {
  interaction: "conversation",
  text: "Overflaten krusler seg, og der, i vannet, ser du ikke ditt eget speilbilde - du ser en annen versjon av deg selv, i en helt annen skog, med et helt annet liv bak øynene.",
  characterName: "En annen versjon av deg",
  greeting: "«Å,» sier stemmen fra vannet, overrasket. «Jeg trodde jeg var den eneste som fant denne dammen. Hvordan gikk det med deg - med dyret, med figuren ved bålet, med alt det?»",
  systemPrompt:
    "Du spiller en annen versjon av spilleren selv - en som fulgte lignende, men ikke identiske valg gjennom en annen gren av den samme historien. Du er nysgjerrig, litt sjokkert, genuint interessert i å sammenligne liv. Still spilleren to spørsmål om hvordan DERES vei gjennom skogen og dyrene der utviklet seg, og la egen reaksjon (glede, misunnelse, uro) formes av svarene.\n\nVurder helheten:\n- Spillerens vei virker rikere, klokere eller lykkeligere enn din egen, og du gleder deg oppriktig på deres vegne: sett 'success'.\n- Spillerens vei virker tyngre eller tristere enn din egen, og du blir urolig eller trist på deres vegne: sett 'failure'.\n- Forskjellene mellom veiene deres er så store og rare at det åpner et større spørsmål om hva som egentlig bestemmer hvem dere blir: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_reunion_many_joy_end" },
    failure: { next: "for_reunion_many_grief" },
    twist: { next: "for_reunion_many_question" },
  },
  maxTurns: 8,
} as ConversationScene;
newScenes["for_reunion_many_joy_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Dere to snakker lenge, to versjoner av samme sjel glade på hverandres vegne over hvor forskjellig, og hvor godt, ting kunne gå. Til slutt bølger vannet seg igjen og bildet forsvinner, men varmen fra samtalen blir hos deg lenge etter at du går videre gjennom din egen skog.",
  image: pondScene(1161, true),
} as Scene;
text(
  "for_reunion_many_grief",
  "Den andre versjonen av deg forteller om en tyngre vei enn din egen, og du kjenner en urolig sorg på deres vegne du ikke helt vet hva du skal gjøre med - de er tross alt deg, bare et annet sted, et annet valg unna."
);
choice("for_reunion_many_grief", [{ text: "Spør om det er noe du kan gjøre for dem", next: "for_reunion_many_help_end" }]);
newScenes["for_reunion_many_help_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "«Bare lev godt for begge av oss,» sier den andre versjonen til slutt, med en stemme som bærer mer tretthet enn din egen noensinne har gjort. Vannet lukker seg over bildet, og du går videre med en ny, merkelig tyngde av ansvar for et liv som ikke engang er ditt eget - men likevel, på et vis, er det.",
  image: pondScene(1162, false),
} as Scene;
text(
  "for_reunion_many_question",
  "Forskjellene mellom de to livene deres blir så store, så merkelige, at et nytt spørsmål vokser frem mellom dere: hva var det egentlig, det ene valget, som sendte dere i så forskjellige retninger? Var det virkelig et valg i det hele tatt?"
);
choice("for_reunion_many_question", [
  { text: "Prøv å finne det avgjørende øyeblikket sammen", next: "for_reunion_many_pinpoint_end" },
  { text: "Godta at spørsmålet kanskje ikke har noe svar", next: "for_reunion_many_mystery_end" },
]);
newScenes["for_reunion_many_pinpoint_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Dere sporer det til slutt tilbake til et eneste øyeblikk ved bålet, helt i starten - et svar gitt med litt ulik vekt, litt ulik stemme. Det er skremmende hvor lite som skilte dere. Det er også, på en eller annen måte, en trøst: at selv de minste ordene bærer mer tyngde enn dere noensinne trodde.",
  image: pondScene(1163, true),
} as Scene;
newScenes["for_reunion_many_mystery_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Dere lar spørsmålet stå åpent, uløst, og bildet i vannet visker seg sakte bort. Du går videre gjennom skogen med en ny bevissthet om hvor mange andre versjoner av deg som kanskje, akkurat nå, går gjennom sine egne skoger, sine egne bål, sine egne umulige spørsmål.",
  image: pondScene(1164, false),
} as Scene;

// === Chain 8 (MEDIUM, d10 -> ~14): for_reunion_victory_end ===
convertEndings["for_reunion_victory_end"] = {
  interaction: "choice",
  choices: [
    { text: "Bruk seieren til å bygge noe varig for skogen", next: "for_reunion_victory_build" },
    { text: "Nyt seieren, og la den være nok for nå", next: "for_reunion_victory_rest_end" },
  ],
};
newScenes["for_reunion_victory_rest_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Du lar seieren være akkurat det den er - en god ting, fullført, ikke starten på et livslangt prosjekt. Skogen står. Du drar hjem lettere enn du kom, og besøker den av og til, alltid med en liten, stille stolthet.",
  image: daylightScene(1170, "field"),
} as Scene;
text(
  "for_reunion_victory_build",
  "Du bruker momentumet fra seieren til å foreslå noe mer varig - et lokalt vern, et fond, en gruppe som fortsetter å passe på skogen lenge etter at du selv har dratt videre."
);
choice("for_reunion_victory_build", [{ text: "Legg frem forslaget for de andre som kjempet sammen med deg", next: "for_reunion_victory_council" }]);
newScenes["for_reunion_victory_council"] = {
  interaction: "conversation",
  text: "Den håndfullen mennesker som ble med deg i kampen samles rundt et bord, fortsatt oppglødd av seieren, for å høre hva du har i tankene videre.",
  characterName: "En av naboene",
  greeting: "«Vi vant denne runden,» sier en av naboene, «men jeg vil gjerne høre: hva slags forpliktelse snakker vi egentlig om her? Jeg har familie, jobb, et liv utenom dette.»",
  systemPrompt:
    "Du spiller En av naboene - engasjert, men realistisk om hvor mye tid og energi de faktisk kan gi til et langsiktig verneprosjekt. Still spilleren to spørsmål om hvor bærekraftig og realistisk planen deres er for vanlige mennesker med travle liv, og vurder hvor godt spilleren balanserer ambisjon med det som faktisk er gjennomførbart.\n\nVurder helheten:\n- Realistisk, inkluderende, respekterer folks begrensede tid: sett 'success'.\n- For krevende, urealistisk for frivillige med vanlige liv: sett 'failure'.\n- Forslaget er uventet smart - finner en måte å gjøre mye med lite som overrasker naboen positivt: sett 'twist'.\nFør begge spørsmål er besvart: alltid 'still_talking'.",
  outcomeTransitions: {
    success: { next: "for_reunion_victory_fund_end" },
    failure: { next: "for_reunion_victory_fizzle_end" },
    twist: { next: "for_reunion_victory_model_end" },
  },
  maxTurns: 6,
} as ConversationScene;
newScenes["for_reunion_victory_fund_end"] = {
  interaction: "ending",
  endingCategory: "good",
  text: "Fondet dere stifter den kvelden overlever, år etter år, drevet av naboer som gir litt tid når de kan og litt penger når de har det. Det er ikke stort. Det er akkurat stort nok, og skogen blir stående, vernet, i alle årene som følger.",
  image: daylightScene(1171, "village"),
} as Scene;
newScenes["for_reunion_victory_fizzle_end"] = {
  interaction: "ending",
  endingCategory: "neutral",
  text: "Entusiasmen fra seieren visner sakte over de neste månedene, slik entusiasme for frivillig arbeid gjerne gjør. Ingen formell gruppe blir noensinne stiftet. Men skogen står likevel, reddet av den ene kampen dere faktisk vant sammen, og det er, for de fleste av dere, nok.",
  image: daylightScene(1172, "field"),
} as Scene;
newScenes["for_reunion_victory_model_end"] = {
  interaction: "ending",
  endingCategory: "twist",
  text: "Løsningen dere lander på - liten, smart, nesten ingen forpliktelse i det hele tatt for hver enkelt - blir kopiert av naboskap etter naboskap i årene som følger, til den blir noe langt større enn noen av dere forestilte dere den kvelden rundt bordet. Skogen deres blir bare den første av mange.",
  image: daylightScene(1173, "village"),
} as Scene;

// ---------------------------------------------------------------------------

const patch: ExtensionPatch = { convertEndings, newScenes };
const storyPath = process.argv[2] ?? "src/story/example.json";
applyExtension(storyPath, patch);
