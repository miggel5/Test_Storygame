from typing import Any, Literal

from pydantic import BaseModel


class ConversationMessage(BaseModel):
    role: Literal["user", "character"]
    text: str


class ConversationTurnRequest(BaseModel):
    scene_id: str
    character_name: str
    system_prompt: str
    history: list[ConversationMessage] = []
    message: str


class ConversationTurnResponse(BaseModel):
    reply: str
    outcome: Literal["still_talking", "success", "failure", "twist"]


class SaveGameRequest(BaseModel):
    player_id: str
    current_scene: str
    flags: dict[str, Any] = {}


class SaveGameResponse(BaseModel):
    player_id: str
    current_scene: str
    flags: dict[str, Any]
    saved_at: str
