from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import conversation, save

app = FastAPI(title="Storygame API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(save.router)
app.include_router(conversation.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
