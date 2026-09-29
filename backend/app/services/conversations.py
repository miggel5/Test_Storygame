import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

# Generated from the story sources by `npm run build-story` (frontend/) - do not edit by hand.
_DATA_FILE = Path(__file__).resolve().parent.parent / "conversations.json"


class ConversationConfig(BaseModel):
    character_name: str
    system_prompt: str
    max_turns: int | None = None


@lru_cache(maxsize=1)
def _load() -> dict[str, ConversationConfig]:
    raw = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return {scene_id: ConversationConfig(**cfg) for scene_id, cfg in raw.items()}


def get_conversation(scene_id: str) -> ConversationConfig | None:
    return _load().get(scene_id)
