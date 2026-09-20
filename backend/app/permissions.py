from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import (
    OrganisationMembershipDB,
    UserDB,
    VehicleDB,
)


WORKSPACE_WRITE_ROLES = {
    "owner",
    "admin",
}


def is_platform_admin(
    user: UserDB,
) -> bool:
    return (
        user.role == "admin"
    )


def get_workspace_membership(
    db: Session,
    user: UserDB,
    organisation_id: int,
) -> OrganisationMembershipDB | None:
    return (
        db.query(
            OrganisationMembershipDB
        )
        .filter(
            OrganisationMembershipDB.user_id
            == user.id,
            OrganisationMembershipDB.organisation_id
            == organisation_id,
        )
        .first()
    )


def require_vehicle_write_permission(
    db: Session,
    user: UserDB,
    vehicle: VehicleDB,
) -> None:
    if is_platform_admin(
        user
    ):
        return

    if (
        vehicle.organisation_id
        is None
    ):
        if (
            vehicle.owner_id
            == user.id
        ):
            return

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to modify this vehicle"
            ),
        )

    membership = (
        get_workspace_membership(
            db,
            user,
            vehicle.organisation_id,
        )
    )

    if (
        membership
        and membership.role
        in WORKSPACE_WRITE_ROLES
    ):
        return

    raise HTTPException(
        status_code=403,
        detail=(
            "Workspace owner or admin "
            "permission is required"
        ),
    )