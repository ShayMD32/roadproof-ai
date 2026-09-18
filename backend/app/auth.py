from datetime import (
    datetime,
    timedelta,
    timezone,
)
import os

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    OAuth2PasswordBearer,
)
from jose import JWTError, jwt
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import UserDB


SECRET_KEY = os.getenv(
    "ROADPROOF_SECRET_KEY",
    "dev-secret-change-before-production",
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


password_hasher = (
    PasswordHash.recommended()
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
)


def hash_password(
    password: str,
) -> str:
    return password_hasher.hash(
        password
    )


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return password_hasher.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    user_id: int,
) -> str:
    expires_at = (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            minutes=(
                ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    token: str = Depends(
        oauth2_scheme
    ),
    db: Session = Depends(
        get_db
    ),
) -> UserDB:
    credentials_exception = (
        HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Could not validate "
                "credentials"
            ),
            headers={
                "WWW-Authenticate":
                    "Bearer"
            },
        )
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get(
            "sub"
        )

        if user_id is None:
            raise credentials_exception

        user_id = int(
            user_id
        )

    except (
        JWTError,
        ValueError,
    ):
        raise credentials_exception

    user = (
        db.query(UserDB)
        .filter(
            UserDB.id == user_id
        )
        .first()
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "User account is inactive"
            ),
        )

    return user