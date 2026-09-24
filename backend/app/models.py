from typing import Any

from pydantic import BaseModel


class SaveGameRequest(BaseModel):
    player_id: str
    current_scene: str
    flags: dict[str, Any] = {}


class SaveGameResponse(BaseModel):
    player_id: str
    current_scene: str
    flags: dict[str, Any]
    saved_at: str
