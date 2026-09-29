from typing import Any, Literal

from pydantic import BaseModel, Field

# Upper bounds keep a single request (and so a single API bill) small.
MAX_HISTORY_MESSAGES = 60
MAX_PLAYER_MESSAGE_CHARS = 1000
MAX_HISTORY_TEXT_CHARS = 4000


class ConversationMessage(BaseModel):
    role: Literal["user", "character"]
    text: str = Field(max_length=MAX_HISTORY_TEXT_CHARS)


class ConversationTurnRequest(BaseModel):
    """The character's persona and rules live on the server, keyed by scene id."""

    scene_id: str = Field(max_length=100)
    history: list[ConversationMessage] = Field(default_factory=list, max_length=MAX_HISTORY_MESSAGES)
    message: str = Field(min_length=1, max_length=MAX_PLAYER_MESSAGE_CHARS)


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
