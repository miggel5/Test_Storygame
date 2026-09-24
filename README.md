# Storygame

Et interaktivt fortellingsspill med dialog og valg. Frontend i React/TypeScript, backend i Python (FastAPI) for lagring av fremgang.

## Struktur

```
frontend/   React + TypeScript (Vite). Selve spillet kjører her.
backend/    FastAPI. Valgfri å bruke - spillet lagrer lokalt (localStorage) uten den.
```

### Historieformat

Historien er data (JSON), ikke kode. Se [`frontend/src/story/example.json`](frontend/src/story/example.json) og typene i [`frontend/src/types/story.ts`](frontend/src/types/story.ts).

Hver scene har en tekst og en liste med valg. Et valg kan:
- sette flagg (`setFlags`) som huskes resten av spillet
- kreve at et flagg har en bestemt verdi for å vises (`condition`)

Dette gir forgrenede historier med minne ("spilleren husker valget fra tidligere") uten noe eget scriptspråk.

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
