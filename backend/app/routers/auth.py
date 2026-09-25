from fastapi import APIRouter, Depends

from app.auth import require_login

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/check", dependencies=[Depends(require_login)])
def check() -> dict[str, bool]:
    return {"ok": True}
