import anthropic
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models import ConversationTurnRequest, ConversationTurnResponse
from app.services.character import CharacterReplyError, call_character
from app.services.conversations import get_conversation

router = APIRouter(prefix="/api/conversation", tags=["conversation"])


@router.post("/turn", response_model=ConversationTurnResponse)
def turn(req: ConversationTurnRequest) -> ConversationTurnResponse:
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503, detail="Conversation feature not configured (missing ANTHROPIC_API_KEY)"
        )
    conversation = get_conversation(req.scene_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Unknown conversation scene")
    player_turns = sum(1 for m in req.history if m.role == "user")
    if conversation.max_turns is not None and player_turns >= conversation.max_turns:
        raise HTTPException(status_code=409, detail="Conversation has reached its turn limit")

    try:
        return call_character(conversation.system_prompt, req.history, req.message)
    except anthropic.RateLimitError as exc:
        raise HTTPException(status_code=429, detail="Rate limited by Anthropic API") from exc
    except anthropic.APIStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Anthropic API error: {exc}") from exc
    except anthropic.APIConnectionError as exc:
        raise HTTPException(status_code=502, detail="Could not reach Anthropic API") from exc
    except CharacterReplyError as exc:
        raise HTTPException(status_code=502, detail="Character gave no usable reply") from exc
