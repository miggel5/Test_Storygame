from fastapi import APIRouter, HTTPException

from app.models import SaveGameRequest, SaveGameResponse
from app.storage import load_game, save_game

router = APIRouter(prefix="/api/save", tags=["save"])


@router.post("", response_model=SaveGameResponse)
def create_save(save: SaveGameRequest) -> SaveGameResponse:
    return save_game(save)


@router.get("/{player_id}", response_model=SaveGameResponse)
def get_save(player_id: str) -> SaveGameResponse:
    record = load_game(player_id)
    if record is None:
        raise HTTPException(status_code=404, detail="No save found for this player")
    return record
