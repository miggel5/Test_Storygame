from typing import Literal

import anthropic
from pydantic import BaseModel, Field

from app.config import settings
from app.models import ConversationMessage, ConversationTurnResponse

_PROTOCOL_SUFFIX = (
    "\n\n---\nSvar alltid i karakter, på norsk. Klassifiser utfallet av spillerens "
    "SISTE replikk som 'still_talking' med mindre betingelsene over er tydelig oppfylt."
)


class CharacterReplyError(Exception):
    """The model answered, but not with a usable structured reply (refusal, truncation, ...)."""


class _CharacterReply(BaseModel):
    reply: str = Field(description="Karakterens replikk i respons til spilleren, på norsk.")
    outcome: Literal["still_talking", "success", "failure", "twist"] = Field(
        description="'still_talking' med mindre spillerens siste replikk tydelig oppfyller "
        "en av betingelsene i systemprompten."
    )


_client = anthropic.Anthropic(api_key=settings.anthropic_api_key or None)


def call_character(
    system_prompt: str, history: list[ConversationMessage], user_message: str
) -> ConversationTurnResponse:
    messages = [
        {"role": "user" if m.role == "user" else "assistant", "content": m.text} for m in history
    ]
    messages.append({"role": "user", "content": user_message})

    response = _client.messages.parse(
        model=settings.anthropic_model,
        max_tokens=1024,
        system=system_prompt + _PROTOCOL_SUFFIX,
        messages=messages,
        output_format=_CharacterReply,
    )
    parsed = response.parsed_output
    if parsed is None:
        raise CharacterReplyError(f"No structured reply (stop_reason={response.stop_reason})")
    return ConversationTurnResponse(reply=parsed.reply, outcome=parsed.outcome)
