# Storygame

Et interaktivt fortellingsspill med dialog og valg. Frontend i React/TypeScript, backend i Python (FastAPI) for lagring av fremgang.

## Struktur

```
content/    Kilden til historien (scener og pikselkunst) - det du redigerer.
frontend/   React + TypeScript (Vite). Selve spillet kjører her.
backend/    FastAPI. Samtalene (LLM) krever den; lagring av fremgang skjer lokalt (localStorage).
```

### Historieformat

Historien er data (JSON), ikke kode. Typene ligger i [`frontend/src/types/story.ts`](frontend/src/types/story.ts).

```
content/meta.json             tittel og startscene
content/scenes/<spor>.json    scener for ett spor, pent formatert (lesbare git-diff)
content/art/<spor>.json       pikselkunst for samme spor, én scene per linje (RLE-kodet)
```

Sporet en scene hører til bestemmes av id-prefikset (se `TRACK_PREFIXES` i [`frontend/scripts/storyBuild.ts`](frontend/scripts/storyBuild.ts)); scener uten kjent prefiks ligger i `intro.json`.

Hver scene har en tekst og en liste med valg. Et valg kan:
- sette flagg (`setFlags`) som huskes resten av spillet
- kreve at et flagg har en bestemt verdi for å vises (`condition`)

Dette gir forgrenede historier med minne ("spilleren husker valget fra tidligere") uten noe eget scriptspråk.

Samtalescener har en `systemPrompt` i kilden. Den havner **ikke** i frontend-bundelen: `build-story` flytter den til `backend/app/conversations.json`, og klienten sender bare scene-id.

#### Arbeidsflyt for historien

Kjøres fra `frontend/`:

```bash
npm run validate-story   # sjekker lenker, flagg, softlock, kunst og gren-statistikk
npm run build-story      # genererer frontend/src/story/story.generated.json og backend/app/conversations.json
npm run verify           # validate + at genererte filer er oppdatert + lint + typecheck
```

De genererte filene skal committes (Vercel og Render bygger uten `content/`). Nye bilder lages med hjelperne i `frontend/scripts/pixelArtHelpers.ts`; `buildSpec` gir ferdig kodet kunst du legger i `content/art/<spor>.json`.

## Kom i gang

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Åpne linken Vite skriver ut (typisk http://localhost:5173).

### Backend (valgfri)

Backend brukes kun hvis du vil lagre fremgang på en server i stedet for i nettleseren.

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

API-et er dokumentert på http://localhost:8001/docs når serveren kjører.

Endepunkter:
- `GET /api/health`
- `POST /api/save` — lagre `{ player_id, current_scene, flags }`
- `GET /api/save/{player_id}` — hent siste lagring

Lagringer ligger i `backend/data/saves.json` (en enkel fil-database for å komme i gang — bytt til en ekte database når det trengs).

### Passordbeskyttelse

Backend krever HTTP Basic Auth på `/api/save` og `/api/conversation` hvis `APP_PASSWORD` er satt i `backend/.env`. Er den tom, er det ingen sperre (praktisk lokalt) - **sett alltid passord i produksjon**, ellers kan hvem som helst bruke API-nøkkelen din via samtale-endepunktet. Brukernavn er `spiller` som standard (`APP_USERNAME`; sett `VITE_APP_USERNAME` i frontend hvis du bytter). Passord kan inneholde æøå. Frontend spør om passord ved oppstart og husker det i fanen (sessionStorage) resten av økten.

## Deploy (gratis)

- **Frontend → Vercel**: importer GitHub-repoet, sett "Root Directory" til `frontend`. Vercel oppdager Vite automatisk. Legg til miljøvariabelen `VITE_API_BASE_URL` = backend-URL-en fra Render.
- **Backend → Render**: "New Blueprint" → koble til GitHub-repoet, Render finner `render.yaml` i rotmappen automatisk (gratis plan). Fyll inn miljøvariablene `ANTHROPIC_API_KEY`, `CORS_ORIGINS` (den ferdige Vercel-URL-en) og `APP_USERNAME`/`APP_PASSWORD` i Render-dashboardet.

Merk: Render sin gratis plan "sovner" etter litt inaktivitet — første kall etter en pause kan ta ca. 30–60 sekunder.
