import json
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock

from app.models import SaveGameRequest, SaveGameResponse

_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "saves.json"
_LOCK = Lock()


def _read_all() -> dict:
    if not _DATA_FILE.exists():
        return {}
    return json.loads(_DATA_FILE.read_text(encoding="utf-8"))


def _write_all(data: dict) -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    _DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def save_game(save: SaveGameRequest) -> SaveGameResponse:
    with _LOCK:
        data = _read_all()
        record = {
            "current_scene": save.current_scene,
            "flags": save.flags,
            "saved_at": datetime.now(UTC).isoformat(),
        }
        data[save.player_id] = record
        _write_all(data)
        return SaveGameResponse(player_id=save.player_id, **record)


def load_game(player_id: str) -> SaveGameResponse | None:
    with _LOCK:
        data = _read_all()
        record = data.get(player_id)
        if record is None:
            return None
        return SaveGameResponse(player_id=player_id, **record)
