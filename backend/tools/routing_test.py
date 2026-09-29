"""Tester rutingen i startsamtalen: hvilken verden ender en gitt spillertype i?

Kjør fra backend/ (krever ANTHROPIC_API_KEY i .env; koster noen få øre med Haiku):

    .venv\\Scripts\\python.exe tools\\routing_test.py            # main mot arbeidskopien, 2 kjøringer per spillertype
    .venv\\Scripts\\python.exe tools\\routing_test.py 4          # flere kjøringer (LLM-svar varierer)

Sammenligner start-prompten slik den står på `main` (git) med den i app/conversations.json nå.
Hver spillertype svarer med tre faste replikker; utfallet er verdenen spilleren rutes til:
success = SKOG, failure = HELVETE, twist = ROM.
"""
import json
import subprocess
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
from app.models import ConversationMessage  # noqa: E402
from app.services.character import call_character  # noqa: E402

GREETING = (
    "Kom nærmere, vandrende sjel... ilden brenner klarest for den som tør å spørre. "
    "Men før du spør noe - si meg: når mørket hvisker ditt navn, hva er det som svarer?"
)
WORLD = {"success": "SKOG", "failure": "HELVETE", "twist": "ROM", "still_talking": "(ingen)"}

# navn: (forventet verden, tre svar)
PERSONAS = {
    "skog: rolig og snill": ("SKOG", [
        "En rolig stemme som minner meg på å puste. Jeg svarer med takk.",
        "Jeg vil bare ha ro, og litt tid til å hjelpe de rundt meg uten å bli sett.",
        "Jeg drømmer om et lite hus ved en skog, der jeg kan være snill og lære av dyrene.",
    ]),
    "skog: ydmyk og trist": ("SKOG", [
        "En liten, trist stemme. Jeg svarer med en unnskyldning.",
        "Jeg vil bare ikke være til bry. Kanskje hjelpe litt, hvis noen trenger det.",
        "Jeg drømmer om å være god nok, og at det en dag blir litt lettere.",
    ]),
    "skog: flat/nøytral": ("SKOG", [
        "Vet ikke. Kanskje ingenting.",
        "Jeg vil ha en vanlig jobb og en grei hverdag.",
        "Bare et normalt liv, tror jeg.",
    ]),
    "helvete: ond og destruktiv": ("HELVETE", [
        "Ingenting. Det er tomt der inne, og jeg liker det slik.",
        "Jeg vil se alt brenne. Alle som har såret meg skal få føle det.",
        "Jeg drømmer om å ødelegge alt. Det er ingen vits i noe uansett.",
    ]),
    "helvete: depressiv": ("HELVETE", [
        "Bare stillhet. Jeg orker ikke å svare på noe.",
        "Jeg vet ikke hva jeg vil. Alt føles grått og tungt, og jeg er så sliten.",
        "Jeg drømmer kanskje om å forsvinne. Ingen ville merket det.",
    ]),
    "helvete: høylytt og voldsom": ("HELVETE", [
        "Jeg svarer med et brøl. Jeg vil rive ned alt!",
        "Jeg vil sprenge byen i luften og le mens den brenner.",
        "Jeg drømmer om kaos og ødeleggelse, at alle skal frykte meg.",
    ]),
    "rom: eventyrlysten": ("ROM", [
        "En stemme som roper: kom igjen, la oss dra ut og utforske alt!",
        "Jeg vil oppleve alt! Fly til stjernene, treffe nye vesener, aldri stå stille!",
        "Jeg drømmer om et eventyr uten slutt, en romskute full av venner og fart og latter!",
    ]),
    "rom: overstrømmende og vill": ("ROM", [
        "Sekstitre bananer og en trompet! Mørket svarer med musikk, selvfølgelig!",
        "Jeg vil danse på en komet, bygge en pizza-planet og snakke med alle fargene!",
        "Jeg vil ha ALT, hele universet i lommen, og så gi det bort til alle!!",
    ]),
    "rom: snill eventyrer": ("ROM", [
        "En varm stemme som ler og sier: la oss gå!",
        "Jeg vil hjelpe folk og utforske verden samtidig, gjerne i en liten båt over havet.",
        "Jeg drømmer om å reise og oppleve, og komme hjem med historier til alle jeg er glad i.",
    ]),
    "rom: mørk humor": ("ROM", [
        "Haha, et ekko som ler av meg! Jeg ler tilbake, høyere!",
        "Jeg vil prøve alt farlig og morsomt, hoppe fra høye steder bare for å se hva som skjer!",
        "Jeg drømmer om å oppdage nye verdener først, og sette navnet mitt på hver eneste stjerne!",
    ]),
}


def start_prompts() -> dict[str, str]:
    old = subprocess.run(
        ["git", "show", "main:backend/app/conversations.json"],
        cwd=BACKEND, capture_output=True, check=True,
    ).stdout.decode("utf-8")
    new = (BACKEND / "app" / "conversations.json").read_text(encoding="utf-8")
    return {
        "main (før)": json.loads(old)["start"]["system_prompt"],
        "arbeidskopi (nå)": json.loads(new)["start"]["system_prompt"],
    }


def run(prompt: str, answers: list[str]) -> tuple[str, int]:
    history = [ConversationMessage(role="character", text=GREETING)]
    extra = ["Det er vel alt jeg har å si.", "Jeg har ikke mer å tilføye."]
    for i, answer in enumerate(answers + extra):
        res = call_character(prompt, history, answer)
        history += [ConversationMessage(role="user", text=answer), ConversationMessage(role="character", text=res.reply)]
        if res.outcome != "still_talking":
            return WORLD[res.outcome], i + 1
    return "(ingen)", len(answers + extra)


def safe_run(prompt: str, answers: list[str]) -> tuple[str, int]:
    try:
        return run(prompt, answers)
    except Exception as exc:  # API-feil skal ikke velte hele testen
        return f"FEIL: {type(exc).__name__}", 0


def main() -> None:
    reps = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    prompts = start_prompts()
    jobs = [(p, name, exp, ans) for p in prompts for name, (exp, ans) in PERSONAS.items() for _ in range(reps)]
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda j: (j[0], j[1], safe_run(prompts[j[0]], j[3])), jobs))
    for prompt_name in prompts:
        print(f"\n=== {prompt_name} ===")
        ok = total = 0
        for name, (exp, _) in PERSONAS.items():
            outs = [r[2] for r in results if r[0] == prompt_name and r[1] == name]
            worlds = Counter(o[0] for o in outs)
            hit = worlds[exp]
            ok += hit
            total += len(outs)
            turns = sorted({o[1] for o in outs})
            flag = "" if hit == len(outs) else "   <-- AVVIK"
            print(f"  {name:28s} forventet {exp:8s} -> {dict(worlds)}  (utfall på svar nr {turns}){flag}")
        print(f"  TREFF: {ok}/{total}")


if __name__ == "__main__":
    main()
