from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import require_login
from app.config import settings
from app.routers import auth, conversation, save

app = FastAPI(title="Storygame API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(save.router, dependencies=[Depends(require_login)])
app.include_router(conversation.router, dependencies=[Depends(require_login)])
app.include_router(auth.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
