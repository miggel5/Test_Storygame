import binascii
import secrets
from base64 import b64decode

from fastapi import Header, HTTPException

from app.config import settings


def _parse_basic(authorization: str | None) -> tuple[str, str] | None:
    """Parses `Authorization: Basic ...` as UTF-8 (RFC 7617).

    fastapi.security.HTTPBasic decodes as ASCII only, which would reject any password with æøå.
    """
    if not authorization:
        return None
    scheme, _, param = authorization.partition(" ")
    if scheme.lower() != "basic":
        return None
    try:
        decoded = b64decode(param.strip(), validate=True).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError):
        return None
    username, separator, password = decoded.partition(":")
    return (username, password) if separator else None


def _matches(given: str, expected: str) -> bool:
    # compare_digest on str only accepts ASCII; compare UTF-8 bytes instead.
    return secrets.compare_digest(given.encode("utf-8"), expected.encode("utf-8"))


def require_login(authorization: str | None = Header(default=None)) -> None:
    if not settings.app_password:
        return

    credentials = _parse_basic(authorization)
    valid = (
        credentials is not None
        and _matches(credentials[0], settings.app_username)
        and _matches(credentials[1], settings.app_password)
    )
    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Feil brukernavn eller passord",
            headers={"WWW-Authenticate": "Basic"},
        )
