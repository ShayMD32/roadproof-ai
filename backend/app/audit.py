import json

from sqlalchemy.orm import Session

from app.models import (
    AuditLogDB,
    UserDB,
)


def create_audit_log(
    db: Session,
    *,
    actor: UserDB | None,
    organisation_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: dict | None = None,
) -> AuditLogDB:
    audit_log = AuditLogDB(
        actor_user_id=(
            actor.id
            if actor
            else None
        ),
        organisation_id=organisation_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=(
            json.dumps(
                details
            )
            if details is not None
            else None
        ),
    )

    db.add(
        audit_log
    )

    return audit_log