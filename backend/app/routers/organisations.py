from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.auth import (
    get_current_user,
)

from app.database import (
    get_db,
)

from app.models import (
    OrganisationDB,
    OrganisationMembershipDB,
    UserDB,
    VehicleDB,
)

from app.schemas import (
    OrganisationCreateRequest,
    OrganisationInviteRequest,
    OrganisationMemberResponse,
    OrganisationMemberRoleUpdateRequest,
    OrganisationResponse,
    OrganisationSummaryResponse,
)


router = APIRouter(
    prefix="/organisations",
    tags=["organisations"],
)


ALLOWED_MEMBER_ROLES = {
    "admin",
    "member",
}


def is_platform_admin(
    user: UserDB,
) -> bool:
    return (
        user.role == "admin"
    )


def get_membership(
    db: Session,
    organisation_id: int,
    user_id: int,
) -> OrganisationMembershipDB | None:
    return (
        db.query(
            OrganisationMembershipDB
        )
        .filter(
            OrganisationMembershipDB.organisation_id
            == organisation_id,
            OrganisationMembershipDB.user_id
            == user_id,
        )
        .first()
    )


def get_organisation_or_404(
    db: Session,
    organisation_id: int,
) -> OrganisationDB:
    organisation = (
        db.query(OrganisationDB)
        .filter(
            OrganisationDB.id
            == organisation_id
        )
        .first()
    )

    if not organisation:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found",
        )

    return organisation


def require_workspace_access(
    db: Session,
    organisation_id: int,
    current_user: UserDB,
) -> OrganisationMembershipDB | None:
    if is_platform_admin(
        current_user
    ):
        return None

    membership = get_membership(
        db,
        organisation_id,
        current_user.id,
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found",
        )

    return membership


def require_workspace_admin(
    db: Session,
    organisation_id: int,
    current_user: UserDB,
) -> OrganisationMembershipDB | None:
    if is_platform_admin(
        current_user
    ):
        return None

    membership = get_membership(
        db,
        organisation_id,
        current_user.id,
    )

    if (
        not membership
        or membership.role
        not in {
            "owner",
            "admin",
        }
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Workspace administrator "
                "access required"
            ),
        )

    return membership


def require_workspace_owner(
    db: Session,
    organisation_id: int,
    current_user: UserDB,
) -> OrganisationMembershipDB | None:
    if is_platform_admin(
        current_user
    ):
        return None

    membership = get_membership(
        db,
        organisation_id,
        current_user.id,
    )

    if (
        not membership
        or membership.role != "owner"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Workspace owner "
                "access required"
            ),
        )

    return membership


@router.get(
    "",
    response_model=list[
        OrganisationSummaryResponse
    ],
)
def list_organisations(
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    if is_platform_admin(
        current_user
    ):
        organisations = (
            db.query(OrganisationDB)
            .filter(
                OrganisationDB.is_active
                .is_(True)
            )
            .order_by(
                OrganisationDB.id
            )
            .all()
        )

        results = []

        for organisation in organisations:
            member_count = (
                db.query(
                    OrganisationMembershipDB
                )
                .filter(
                    OrganisationMembershipDB.organisation_id
                    == organisation.id
                )
                .count()
            )

            vehicle_count = (
                db.query(VehicleDB)
                .filter(
                    VehicleDB.organisation_id
                    == organisation.id
                )
                .count()
            )

            membership = get_membership(
                db,
                organisation.id,
                current_user.id,
            )

            results.append(
                {
                    "id":
                        organisation.id,

                    "name":
                        organisation.name,

                    "role": (
                        membership.role
                        if membership
                        else "platform_admin"
                    ),

                    "member_count":
                        member_count,

                    "vehicle_count":
                        vehicle_count,

                    "created_at":
                        organisation.created_at,
                }
            )

        return results

    memberships = (
        db.query(
            OrganisationMembershipDB
        )
        .filter(
            OrganisationMembershipDB.user_id
            == current_user.id
        )
        .order_by(
            OrganisationMembershipDB.id
        )
        .all()
    )

    results = []

    for membership in memberships:
        organisation = (
            membership.organisation
        )

        if not organisation.is_active:
            continue

        member_count = (
            db.query(
                OrganisationMembershipDB
            )
            .filter(
                OrganisationMembershipDB.organisation_id
                == organisation.id
            )
            .count()
        )

        vehicle_count = (
            db.query(VehicleDB)
            .filter(
                VehicleDB.organisation_id
                == organisation.id
            )
            .count()
        )

        results.append(
            {
                "id":
                    organisation.id,

                "name":
                    organisation.name,

                "role":
                    membership.role,

                "member_count":
                    member_count,

                "vehicle_count":
                    vehicle_count,

                "created_at":
                    organisation.created_at,
            }
        )

    return results


@router.post(
    "",
    response_model=OrganisationResponse,
    status_code=201,
)
def create_organisation(
    request: OrganisationCreateRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    name = (
        request.name
        .strip()
    )

    organisation = OrganisationDB(
        name=name,
        created_by_user_id=(
            current_user.id
        ),
        is_active=True,
    )

    try:
        db.add(
            organisation
        )

        db.flush()

        membership = (
            OrganisationMembershipDB(
                organisation_id=(
                    organisation.id
                ),
                user_id=(
                    current_user.id
                ),
                role="owner",
            )
        )

        db.add(
            membership
        )

        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Organisation creation "
                "failed"
            ),
        )

    db.refresh(
        organisation
    )

    return organisation


@router.get(
    "/{organisation_id}",
    response_model=OrganisationResponse,
)
def get_organisation(
    organisation_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    organisation = (
        get_organisation_or_404(
            db,
            organisation_id,
        )
    )

    require_workspace_access(
        db,
        organisation_id,
        current_user,
    )

    return organisation


@router.get(
    "/{organisation_id}/members",
    response_model=list[
        OrganisationMemberResponse
    ],
)
def list_members(
    organisation_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    get_organisation_or_404(
        db,
        organisation_id,
    )

    require_workspace_access(
        db,
        organisation_id,
        current_user,
    )

    memberships = (
        db.query(
            OrganisationMembershipDB
        )
        .filter(
            OrganisationMembershipDB.organisation_id
            == organisation_id
        )
        .order_by(
            OrganisationMembershipDB.id
        )
        .all()
    )

    return [
        {
            "membership_id":
                membership.id,

            "user_id":
                membership.user.id,

            "email":
                membership.user.email,

            "full_name":
                membership.user.full_name,

            "role":
                membership.role,

            "joined_at":
                membership.created_at,
        }
        for membership
        in memberships
    ]


@router.post(
    "/{organisation_id}/members",
    response_model=OrganisationMemberResponse,
    status_code=201,
)
def add_member(
    organisation_id: int,
    request: OrganisationInviteRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    get_organisation_or_404(
        db,
        organisation_id,
    )

    current_membership = (
        require_workspace_admin(
            db,
            organisation_id,
            current_user,
        )
    )

    role = (
        request.role
        .strip()
        .lower()
    )

    if role not in ALLOWED_MEMBER_ROLES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be admin "
                "or member"
            ),
        )

    if (
        current_membership
        and current_membership.role
        == "admin"
        and role == "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only the workspace owner "
                "can add administrators"
            ),
        )

    email = (
        str(request.email)
        .strip()
        .lower()
    )

    user = (
        db.query(UserDB)
        .filter(
            UserDB.email
            == email
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail=(
                "RoadProof user not found"
            ),
        )

    existing_membership = (
        get_membership(
            db,
            organisation_id,
            user.id,
        )
    )

    if existing_membership:
        raise HTTPException(
            status_code=409,
            detail=(
                "User is already a member "
                "of this workspace"
            ),
        )

    membership = (
        OrganisationMembershipDB(
            organisation_id=(
                organisation_id
            ),
            user_id=user.id,
            role=role,
        )
    )

    db.add(
        membership
    )

    db.commit()

    db.refresh(
        membership
    )

    return {
        "membership_id":
            membership.id,

        "user_id":
            user.id,

        "email":
            user.email,

        "full_name":
            user.full_name,

        "role":
            membership.role,

        "joined_at":
            membership.created_at,
    }


@router.patch(
    "/{organisation_id}/members/"
    "{user_id}",
    response_model=OrganisationMemberResponse,
)
def update_member_role(
    organisation_id: int,
    user_id: int,
    request: OrganisationMemberRoleUpdateRequest,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    get_organisation_or_404(
        db,
        organisation_id,
    )

    require_workspace_owner(
        db,
        organisation_id,
        current_user,
    )

    role = (
        request.role
        .strip()
        .lower()
    )

    if role not in ALLOWED_MEMBER_ROLES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be admin "
                "or member"
            ),
        )

    membership = get_membership(
        db,
        organisation_id,
        user_id,
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )

    if membership.role == "owner":
        raise HTTPException(
            status_code=400,
            detail=(
                "Workspace owner role "
                "cannot be changed here"
            ),
        )

    membership.role = role

    db.commit()

    db.refresh(
        membership
    )

    return {
        "membership_id":
            membership.id,

        "user_id":
            membership.user.id,

        "email":
            membership.user.email,

        "full_name":
            membership.user.full_name,

        "role":
            membership.role,

        "joined_at":
            membership.created_at,
    }


@router.delete(
    "/{organisation_id}/members/"
    "{user_id}",
)
def remove_member(
    organisation_id: int,
    user_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    get_organisation_or_404(
        db,
        organisation_id,
    )

    current_membership = (
        require_workspace_admin(
            db,
            organisation_id,
            current_user,
        )
    )

    membership = get_membership(
        db,
        organisation_id,
        user_id,
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )

    if membership.role == "owner":
        raise HTTPException(
            status_code=400,
            detail=(
                "Workspace owner cannot "
                "be removed"
            ),
        )

    if (
        current_membership
        and current_membership.role
        == "admin"
        and membership.role
        == "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Administrators cannot "
                "remove other administrators"
            ),
        )

    db.delete(
        membership
    )

    db.commit()

    return {
        "message":
            "Member removed successfully"
    }