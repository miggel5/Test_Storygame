import secrets

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.config import settings

_security = HTTPBasic(auto_error=False)


def require_login(credentials: HTTPBasicCredentials | None = Depends(_security)) -> None:
    if not settings.app_password:
        return

    valid = (
        credentials is not None
        and secrets.compare_digest(credentials.username, settings.app_username)
        and secrets.compare_digest(credentials.password, settings.app_password)
    )
    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Feil brukernavn eller passord",
            headers={"WWW-Authenticate": "Basic"},
        )
