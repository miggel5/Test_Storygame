import anthropic
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models import ConversationTurnRequest, ConversationTurnResponse
from app.services.character import call_character

router = APIRouter(prefix="/api/conversation", tags=["conversation"])


@router.post("/turn", response_model=ConversationTurnResponse)
def turn(req: ConversationTurnRequest) -> ConversationTurnResponse:
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503, detail="Conversation feature not configured (missing ANTHROPIC_API_KEY)"
        )
    try:
        return call_character(req.system_prompt, req.history, req.message)
    except anthropic.RateLimitError as exc:
        raise HTTPException(status_code=429, detail="Rate limited by Anthropic API") from exc
    except anthropic.APIStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Anthropic API error: {exc}") from exc
    except anthropic.APIConnectionError as exc:
        raise HTTPException(status_code=502, detail="Could not reach Anthropic API") from exc
