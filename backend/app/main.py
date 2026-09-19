import json
import os
from uuid import uuid4

from fastapi import (
    Depends,
    FastAPI,
    File,
    Header,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import (
    DamageImageDB,
    InspectionDB,
    OrganisationDB,
    OrganisationMembershipDB,
    UserDB,
    VehicleDB,
)
from app.routers.organisations import (
    router as organisations_router,
)
from app.schemas import (
    InspectionReportResponse,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    VehicleInspectionSummary,
)
from app.services.inspection_service import (
    analyse_damage_image,
)


app = FastAPI()

app.include_router(
    organisations_router
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Vehicle(BaseModel):
    registration: str
    make: str
    model: str
    year: int


def normalise_registration(
    registration: str,
):
    return (
        registration
        .replace(" ", "")
        .upper()
    )


def is_admin(
    user: UserDB,
) -> bool:
    return (
        user.role == "admin"
    )


def get_user_organisation_ids(
    db: Session,
    user: UserDB,
) -> list[int]:
    memberships = (
        db.query(
            OrganisationMembershipDB
        )
        .filter(
            OrganisationMembershipDB.user_id
            == user.id
        )
        .all()
    )

    return [
        membership.organisation_id
        for membership
        in memberships
    ]


def get_user_memberships(
    db: Session,
    user: UserDB,
) -> list[OrganisationMembershipDB]:
    return (
        db.query(
            OrganisationMembershipDB
        )
        .filter(
            OrganisationMembershipDB.user_id
            == user.id
        )
        .order_by(
            OrganisationMembershipDB.id
        )
        .all()
    )


def get_selected_organisation(
    db: Session,
    user: UserDB,
    workspace_id: int | None,
    allow_global_admin: bool = False,
) -> OrganisationDB | None:
    if (
        is_admin(user)
        and workspace_id is None
        and allow_global_admin
    ):
        return None

    if workspace_id is not None:
        organisation = (
            db.query(OrganisationDB)
            .filter(
                OrganisationDB.id
                == workspace_id,
                OrganisationDB.is_active
                .is_(True),
            )
            .first()
        )

        if not organisation:
            raise HTTPException(
                status_code=404,
                detail="Workspace not found",
            )

        if is_admin(user):
            return organisation

        membership = (
            db.query(
                OrganisationMembershipDB
            )
            .filter(
                OrganisationMembershipDB.user_id
                == user.id,
                OrganisationMembershipDB.organisation_id
                == organisation.id,
            )
            .first()
        )

        if not membership:
            raise HTTPException(
                status_code=404,
                detail="Workspace not found",
            )

        return organisation

    memberships = [
        membership
        for membership
        in get_user_memberships(
            db,
            user,
        )
        if (
            membership.organisation
            and membership.organisation.is_active
        )
    ]

    if not memberships:
        raise HTTPException(
            status_code=409,
            detail=(
                "User does not have "
                "an active workspace"
            ),
        )

    if len(memberships) == 1:
        return memberships[
            0
        ].organisation

    raise HTTPException(
        status_code=409,
        detail=(
            "Multiple workspaces available. "
            "Select one using X-Workspace-ID"
        ),
    )


def get_primary_organisation(
    db: Session,
    user: UserDB,
) -> OrganisationDB | None:
    memberships = (
        get_user_memberships(
            db,
            user,
        )
    )

    if not memberships:
        return None

    return memberships[
        0
    ].organisation


def get_severity_factors(
    inspection: InspectionDB,
) -> dict:
    if not inspection.severity_factors:
        return {}

    try:
        return json.loads(
            inspection.severity_factors
        )
    except json.JSONDecodeError:
        return {}


def get_review_metadata(
    inspection: InspectionDB,
) -> dict | None:
    factors = get_severity_factors(
        inspection
    )

    review = factors.get(
        "review"
    )

    if not isinstance(
        review,
        dict,
    ):
        return None

    return review


def get_model_thresholds(
    inspection: InspectionDB,
) -> dict | None:
    factors = get_severity_factors(
        inspection
    )

    thresholds = factors.get(
        "model_thresholds"
    )

    if not isinstance(
        thresholds,
        dict,
    ):
        return None

    return thresholds


def user_to_dict(
    user: UserDB,
) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


def apply_vehicle_access_filter(
    query,
    db: Session,
    current_user: UserDB,
    workspace_id: int | None = None,
):
    organisation = (
        get_selected_organisation(
            db,
            current_user,
            workspace_id,
            allow_global_admin=True,
        )
    )

    if organisation is None:
        return query

    return query.filter(
        VehicleDB.organisation_id
        == organisation.id
    )


def get_vehicle_for_user(
    db: Session,
    registration: str,
    current_user: UserDB,
    workspace_id: int | None = None,
) -> VehicleDB | None:
    normalised_registration = (
        normalise_registration(
            registration
        )
    )

    base_query = (
        db.query(VehicleDB)
        .filter(
            VehicleDB.registration
            == normalised_registration
        )
    )

    if (
        is_admin(current_user)
        and workspace_id is None
    ):
        organisation_ids = (
            get_user_organisation_ids(
                db,
                current_user,
            )
        )

        if organisation_ids:
            own_workspace_vehicle = (
                base_query
                .filter(
                    VehicleDB.organisation_id.in_(
                        organisation_ids
                    )
                )
                .first()
            )

            if own_workspace_vehicle:
                return own_workspace_vehicle

        own_vehicle = (
            base_query
            .filter(
                VehicleDB.owner_id
                == current_user.id
            )
            .first()
        )

        if own_vehicle:
            return own_vehicle

        return base_query.first()

    return (
        apply_vehicle_access_filter(
            base_query,
            db,
            current_user,
            workspace_id,
        )
        .first()
    )


def get_damage_image_for_user(
    db: Session,
    image_id: int,
    current_user: UserDB,
    workspace_id: int | None = None,
) -> DamageImageDB | None:
    query = (
        db.query(DamageImageDB)
        .join(
            VehicleDB,
            DamageImageDB.vehicle_id
            == VehicleDB.id,
        )
        .filter(
            DamageImageDB.id
            == image_id
        )
    )

    query = (
        apply_vehicle_access_filter(
            query,
            db,
            current_user,
            workspace_id,
        )
    )

    return query.first()


def get_inspection_for_user(
    db: Session,
    inspection_id: int,
    current_user: UserDB,
    workspace_id: int | None = None,
) -> InspectionDB | None:
    query = (
        db.query(InspectionDB)
        .join(
            DamageImageDB,
            InspectionDB.damage_image_id
            == DamageImageDB.id,
        )
        .join(
            VehicleDB,
            DamageImageDB.vehicle_id
            == VehicleDB.id,
        )
        .filter(
            InspectionDB.id
            == inspection_id
        )
    )

    query = (
        apply_vehicle_access_filter(
            query,
            db,
            current_user,
            workspace_id,
        )
    )

    return query.first()


@app.get("/")
def home():
    return {
        "message":
            "Welcome to RoadProof AI! 🚗"
    }


@app.get("/health")
def health():
    return {
        "status":
            "Server Running",
        "version":
            "1.0",
    }


@app.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    request: UserRegisterRequest,
    db: Session = Depends(
        get_db
    ),
):
    email = (
        str(request.email)
        .strip()
        .lower()
    )

    full_name = (
        request.full_name
        .strip()
    )

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required",
        )

    if len(request.password) < 8:
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at "
                "least 8 characters"
            ),
        )

    existing_user = (
        db.query(UserDB)
        .filter(
            UserDB.email
            == email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail=(
                "An account with this "
                "email already exists"
            ),
        )

    user = UserDB(
        email=email,
        full_name=full_name,
        password_hash=(
            hash_password(
                request.password
            )
        ),
        role="user",
        is_active=True,
    )

    try:
        db.add(user)
        db.flush()

        organisation = (
            OrganisationDB(
                name=(
                    f"{full_name}'s Workspace"
                ),
                created_by_user_id=(
                    user.id
                ),
                is_active=True,
            )
        )

        db.add(
            organisation
        )
        db.flush()

        membership = (
            OrganisationMembershipDB(
                organisation_id=(
                    organisation.id
                ),
                user_id=user.id,
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
                "Account creation failed"
            ),
        )

    db.refresh(
        user
    )

    return user_to_dict(
        user
    )


@app.post(
    "/auth/login",
    response_model=TokenResponse,
)
def login_user(
    request: UserLoginRequest,
    db: Session = Depends(
        get_db
    ),
):
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

    if (
        user is None
        or not verify_password(
            request.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
            headers={
                "WWW-Authenticate":
                    "Bearer"
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "User account is inactive"
            ),
        )

    access_token = (
        create_access_token(
            user.id
        )
    )

    return {
        "access_token":
            access_token,
        "token_type":
            "bearer",
        "user":
            user_to_dict(
                user
            ),
    }


@app.get(
    "/auth/me",
    response_model=UserResponse,
)
def get_me(
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    return user_to_dict(
        current_user
    )


@app.post("/vehicle")
def create_vehicle(
    vehicle: Vehicle,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    normalised_registration = (
        normalise_registration(
            vehicle.registration
        )
    )

    organisation = (
        get_selected_organisation(
            db,
            current_user,
            workspace_id,
        )
    )

    existing_vehicle = (
        db.query(VehicleDB)
        .filter(
            VehicleDB.registration
            == normalised_registration,
            VehicleDB.organisation_id
            == organisation.id,
        )
        .first()
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=409,
            detail=(
                "Vehicle already exists "
                "in this workspace"
            ),
        )

    new_vehicle = VehicleDB(
        registration=(
            normalised_registration
        ),
        make=vehicle.make,
        model=vehicle.model,
        year=vehicle.year,
        owner_id=current_user.id,
        organisation_id=(
            organisation.id
        ),
    )

    db.add(
        new_vehicle
    )
    db.commit()
    db.refresh(
        new_vehicle
    )

    return {
        "message":
            "Vehicle received successfully!",
        "vehicle":
            new_vehicle,
    }


@app.get("/vehicles")
def get_vehicles(
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    query = (
        db.query(VehicleDB)
    )

    query = (
        apply_vehicle_access_filter(
            query,
            db,
            current_user,
            workspace_id,
        )
    )

    return query.all()


@app.get(
    "/vehicles/{registration}"
)
def get_vehicle(
    registration: str,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle = (
        get_vehicle_for_user(
            db,
            registration,
            current_user,
            workspace_id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


@app.put(
    "/vehicles/{registration}"
)
def update_vehicle(
    registration: str,
    updated_vehicle: Vehicle,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle = (
        get_vehicle_for_user(
            db,
            registration,
            current_user,
            workspace_id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    new_registration = (
        normalise_registration(
            updated_vehicle.registration
        )
    )

    duplicate_query = (
        db.query(VehicleDB)
        .filter(
            VehicleDB.registration
            == new_registration,
            VehicleDB.id
            != vehicle.id,
        )
    )

    if (
        vehicle.organisation_id
        is not None
    ):
        duplicate_query = (
            duplicate_query.filter(
                VehicleDB.organisation_id
                == vehicle.organisation_id
            )
        )
    else:
        duplicate_query = (
            duplicate_query.filter(
                VehicleDB.owner_id
                == vehicle.owner_id
            )
        )

    duplicate_vehicle = (
        duplicate_query.first()
    )

    if duplicate_vehicle:
        raise HTTPException(
            status_code=409,
            detail=(
                "Vehicle already exists "
                "in this workspace"
            ),
        )

    vehicle.registration = (
        new_registration
    )
    vehicle.make = (
        updated_vehicle.make
    )
    vehicle.model = (
        updated_vehicle.model
    )
    vehicle.year = (
        updated_vehicle.year
    )

    db.commit()
    db.refresh(
        vehicle
    )

    return {
        "message":
            "Vehicle updated successfully!",
        "vehicle":
            vehicle,
    }


@app.delete(
    "/vehicles/{registration}"
)
def delete_vehicle(
    registration: str,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle = (
        get_vehicle_for_user(
            db,
            registration,
            current_user,
            workspace_id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    db.delete(
        vehicle
    )
    db.commit()

    return {
        "message":
            "Vehicle deleted successfully!"
    }


@app.post(
    "/vehicles/{registration}/damage-image"
)
async def upload_damage_image(
    registration: str,
    image: UploadFile = File(...),
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle = (
        get_vehicle_for_user(
            db,
            registration,
            current_user,
            workspace_id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    allowed_types = [
        "image/jpeg",
        "image/png",
    ]

    if (
        image.content_type
        not in allowed_types
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPEG and PNG "
                "images are allowed"
            ),
        )

    contents = (
        await image.read()
    )

    max_file_size = (
        5 * 1024 * 1024
    )

    if (
        len(contents)
        > max_file_size
    ):
        raise HTTPException(
            status_code=413,
            detail=(
                "Image file is too large. "
                "Maximum size is 5MB."
            ),
        )

    upload_directory = (
        "uploads"
    )

    os.makedirs(
        upload_directory,
        exist_ok=True,
    )

    unique_filename = (
        f"{uuid4()}_"
        f"{image.filename}"
    )

    file_path = (
        os.path.join(
            upload_directory,
            (
                f"{vehicle.id}_"
                f"{unique_filename}"
            ),
        )
    )

    with open(
        file_path,
        "wb",
    ) as file:
        file.write(
            contents
        )

    damage_image = (
        DamageImageDB(
            filename=(
                unique_filename
            ),
            file_path=file_path,
            vehicle_id=vehicle.id,
        )
    )

    db.add(
        damage_image
    )
    db.commit()
    db.refresh(
        damage_image
    )

    return {
        "message":
            (
                "Damage image uploaded "
                "successfully!"
            ),
        "registration":
            vehicle.registration,
        "image": {
            "id":
                damage_image.id,
            "filename":
                damage_image.filename,
            "file_path":
                damage_image.file_path,
        },
    }


@app.get(
    "/vehicles/{registration}/damage-images"
)
def get_damage_images(
    registration: str,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle = (
        get_vehicle_for_user(
            db,
            registration,
            current_user,
            workspace_id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    damage_images = (
        db.query(DamageImageDB)
        .filter(
            DamageImageDB.vehicle_id
            == vehicle.id
        )
        .all()
    )

    return {
        "registration":
            vehicle.registration,
        "images":
            damage_images,
    }


@app.post(
    "/damage-images/{image_id}/analyse"
)
def analyse_image(
    image_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    damage_image = (
        get_damage_image_for_user(
            db,
            image_id,
            current_user,
            workspace_id,
        )
    )

    if not damage_image:
        raise HTTPException(
            status_code=404,
            detail=(
                "Damage image not found"
            ),
        )

    try:
        inspection = (
            analyse_damage_image(
                image_id=image_id,
                db=db,
            )
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "Damage analysis failed"
            ),
        )

    severity_factors = (
        get_severity_factors(
            inspection
        )
    )

    review = (
        get_review_metadata(
            inspection
        )
    )

    model_thresholds = (
        get_model_thresholds(
            inspection
        )
    )

    return {
        "message":
            (
                "Damage analysis completed "
                "successfully!"
            ),
        "inspection": {
            "id":
                inspection.id,
            "image_id":
                inspection.damage_image_id,
            "status":
                inspection.status,
            "damage_detected":
                inspection.damage_detected,
            "damage_count":
                inspection.damage_count,
            "highest_confidence":
                inspection.highest_confidence,
            "severity":
                inspection.severity,
            "severity_score":
                inspection.severity_score,
            "severity_factors":
                severity_factors,
            "review":
                review,
            "model_thresholds":
                model_thresholds,
            "model": {
                "repository":
                    inspection.model_repository,
                "checkpoint":
                    inspection.model_checkpoint,
                "confidence_threshold":
                    inspection.confidence_threshold,
            },
            "detections": [
                {
                    "id":
                        detection.id,
                    "damage_type":
                        detection.damage_type,
                    "confidence":
                        detection.confidence,
                    "bounding_box": {
                        "x1":
                            detection.x1,
                        "y1":
                            detection.y1,
                        "x2":
                            detection.x2,
                        "y2":
                            detection.y2,
                    },
                    "segmentation": (
                        json.loads(
                            detection.segmentation
                        )
                        if detection.segmentation
                        else []
                    ),
                }
                for detection
                in inspection.detections
            ],
        },
    }


@app.get(
    "/damage-images/{image_id}/inspections"
)
def get_image_inspections(
    image_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    damage_image = (
        get_damage_image_for_user(
            db,
            image_id,
            current_user,
            workspace_id,
        )
    )

    if not damage_image:
        raise HTTPException(
            status_code=404,
            detail=(
                "Damage image not found"
            ),
        )

    inspections = (
        db.query(InspectionDB)
        .filter(
            InspectionDB.damage_image_id
            == image_id
        )
        .order_by(
            InspectionDB.created_at.desc()
        )
        .all()
    )

    return {
        "image_id":
            image_id,
        "inspection_count":
            len(inspections),
        "inspections": [
            {
                "id":
                    inspection.id,
                "status":
                    inspection.status,
                "damage_detected":
                    inspection.damage_detected,
                "damage_count":
                    inspection.damage_count,
                "highest_confidence":
                    inspection.highest_confidence,
                "severity":
                    inspection.severity,
                "severity_score":
                    inspection.severity_score,
                "severity_factors":
                    get_severity_factors(
                        inspection
                    ),
                "review":
                    get_review_metadata(
                        inspection
                    ),
                "model_thresholds":
                    get_model_thresholds(
                        inspection
                    ),
                "created_at":
                    inspection.created_at,
                "model": {
                    "repository":
                        inspection.model_repository,
                    "checkpoint":
                        inspection.model_checkpoint,
                    "confidence_threshold":
                        inspection.confidence_threshold,
                },
                "detections": [
                    {
                        "id":
                            detection.id,
                        "damage_type":
                            detection.damage_type,
                        "confidence":
                            detection.confidence,
                        "bounding_box": {
                            "x1":
                                detection.x1,
                            "y1":
                                detection.y1,
                            "x2":
                                detection.x2,
                            "y2":
                                detection.y2,
                        },
                        "segmentation": (
                            json.loads(
                                detection.segmentation
                            )
                            if detection.segmentation
                            else []
                        ),
                    }
                    for detection
                    in inspection.detections
                ],
            }
            for inspection
            in inspections
        ],
    }


@app.get(
    "/inspections/{inspection_id}/report",
    response_model=InspectionReportResponse,
)
def get_inspection_report(
    inspection_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    inspection = (
        get_inspection_for_user(
            db,
            inspection_id,
            current_user,
            workspace_id,
        )
    )

    if not inspection:
        raise HTTPException(
            status_code=404,
            detail=(
                "Inspection not found"
            ),
        )

    damage_image = (
        inspection.damage_image
    )

    vehicle = (
        damage_image.vehicle
    )

    severity_factors = (
        get_severity_factors(
            inspection
        )
    )

    review = (
        get_review_metadata(
            inspection
        )
    )

    model_thresholds = (
        get_model_thresholds(
            inspection
        )
    )

    return {
        "report": {
            "inspection_id":
                inspection.id,
            "created_at":
                inspection.created_at,
            "status":
                inspection.status,
            "vehicle": {
                "registration":
                    vehicle.registration,
                "make":
                    vehicle.make,
                "model":
                    vehicle.model,
                "year":
                    vehicle.year,
            },
            "image": {
                "id":
                    damage_image.id,
                "filename":
                    damage_image.filename,
            },
            "summary": {
                "damage_detected":
                    inspection.damage_detected,
                "damage_count":
                    inspection.damage_count,
                "highest_confidence":
                    inspection.highest_confidence,
                "severity":
                    inspection.severity,
                "severity_score":
                    inspection.severity_score,
                "severity_factors":
                    severity_factors,
                "review":
                    review,
                "model_thresholds":
                    model_thresholds,
            },
            "detections": [
                {
                    "id":
                        detection.id,
                    "damage_type":
                        detection.damage_type,
                    "confidence":
                        detection.confidence,
                    "bounding_box": {
                        "x1":
                            detection.x1,
                        "y1":
                            detection.y1,
                        "x2":
                            detection.x2,
                        "y2":
                            detection.y2,
                    },
                    "segmentation": (
                        json.loads(
                            detection.segmentation
                        )
                        if detection.segmentation
                        else []
                    ),
                }
                for detection
                in inspection.detections
            ],
            "model": {
                "repository":
                    inspection.model_repository,
                "checkpoint":
                    inspection.model_checkpoint,
                "confidence_threshold":
                    inspection.confidence_threshold,
            },
        },
    }


@app.get(
    "/vehicles/{registration}/inspection-summary",
    response_model=VehicleInspectionSummary,
)
def get_vehicle_inspection_summary(
    registration: str,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle = (
        get_vehicle_for_user(
            db,
            registration,
            current_user,
            workspace_id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    all_inspections = []

    for damage_image in (
        vehicle.damage_images
    ):
        all_inspections.extend(
            damage_image.inspections
        )

    total_damage_detections = sum(
        len(
            inspection.detections
        )
        for inspection
        in all_inspections
    )

    damage_detected = any(
        inspection.damage_detected
        is True
        for inspection
        in all_inspections
    )

    latest_inspection = None

    if all_inspections:
        latest_inspection = max(
            all_inspections,
            key=lambda inspection: (
                inspection.created_at
            ),
        )

    latest_review = None

    if latest_inspection:
        latest_review = (
            get_review_metadata(
                latest_inspection
            )
        )

    return {
        "registration":
            vehicle.registration,
        "vehicle": {
            "registration":
                vehicle.registration,
            "make":
                vehicle.make,
            "model":
                vehicle.model,
            "year":
                vehicle.year,
        },
        "total_images":
            len(
                vehicle.damage_images
            ),
        "total_inspections":
            len(
                all_inspections
            ),
        "damage_detected":
            damage_detected,
        "total_damage_detections":
            total_damage_detections,
        "latest_severity": (
            latest_inspection.severity
            if latest_inspection
            else None
        ),
        "latest_severity_score": (
            latest_inspection.severity_score
            if latest_inspection
            else None
        ),
        "latest_inspection_id": (
            latest_inspection.id
            if latest_inspection
            else None
        ),
        "latest_inspection_confidence": (
            latest_review.get(
                "inspection_confidence"
            )
            if latest_review
            else None
        ),
        "latest_manual_review_required": (
            latest_review.get(
                "manual_review_required"
            )
            if latest_review
            else None
        ),
    }


@app.get(
    "/dashboard/summary"
)
def get_dashboard_summary(
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle_query = (
        db.query(VehicleDB)
    )

    vehicle_query = (
        apply_vehicle_access_filter(
            vehicle_query,
            db,
            current_user,
            workspace_id,
        )
    )

    inspection_query = (
        db.query(InspectionDB)
        .join(
            DamageImageDB,
            InspectionDB.damage_image_id
            == DamageImageDB.id,
        )
        .join(
            VehicleDB,
            DamageImageDB.vehicle_id
            == VehicleDB.id,
        )
    )

    inspection_query = (
        apply_vehicle_access_filter(
            inspection_query,
            db,
            current_user,
            workspace_id,
        )
    )

    vehicles = (
        vehicle_query.all()
    )

    inspections = (
        inspection_query.all()
    )

    total_vehicles = (
        len(vehicles)
    )

    total_inspections = (
        len(inspections)
    )

    damage_detected = sum(
        1
        for inspection
        in inspections
        if (
            inspection.damage_detected
            is True
        )
    )

    clear_inspections = 0
    manual_review_count = 0

    for inspection in inspections:
        review = (
            get_review_metadata(
                inspection
            )
        )

        requires_review = (
            review.get(
                "manual_review_required",
                False,
            )
            if review
            else False
        )

        if requires_review:
            manual_review_count += 1

        if (
            inspection.damage_detected
            is False
            and not requires_review
        ):
            clear_inspections += 1

    recent_query = (
        db.query(InspectionDB)
        .join(
            DamageImageDB,
            InspectionDB.damage_image_id
            == DamageImageDB.id,
        )
        .join(
            VehicleDB,
            DamageImageDB.vehicle_id
            == VehicleDB.id,
        )
    )

    recent_query = (
        apply_vehicle_access_filter(
            recent_query,
            db,
            current_user,
            workspace_id,
        )
    )

    recent_inspections = (
        recent_query
        .order_by(
            InspectionDB.created_at.desc()
        )
        .limit(5)
        .all()
    )

    return {
        "total_vehicles":
            total_vehicles,
        "total_inspections":
            total_inspections,
        "damage_detected":
            damage_detected,
        "clear_inspections":
            clear_inspections,
        "manual_review_count":
            manual_review_count,
        "recent_inspections": [
            {
                "id":
                    inspection.id,
                "damage_detected":
                    inspection.damage_detected,
                "damage_count":
                    inspection.damage_count,
                "severity":
                    inspection.severity,
                "severity_score":
                    inspection.severity_score,
                "inspection_confidence": (
                    (
                        get_review_metadata(
                            inspection
                        )
                        or {}
                    ).get(
                        "inspection_confidence"
                    )
                ),
                "manual_review_required": (
                    (
                        get_review_metadata(
                            inspection
                        )
                        or {}
                    ).get(
                        "manual_review_required"
                    )
                ),
                "created_at":
                    inspection.created_at,
                "registration":
                    (
                        inspection
                        .damage_image
                        .vehicle
                        .registration
                    ),
                "make":
                    (
                        inspection
                        .damage_image
                        .vehicle
                        .make
                    ),
                "model":
                    (
                        inspection
                        .damage_image
                        .vehicle
                        .model
                    ),
            }
            for inspection
            in recent_inspections
        ],
    }


@app.delete(
    "/damage-images/{image_id}"
)
def delete_damage_image(
    image_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    damage_image = (
        get_damage_image_for_user(
            db,
            image_id,
            current_user,
            workspace_id,
        )
    )

    if not damage_image:
        raise HTTPException(
            status_code=404,
            detail=(
                "Damage image not found"
            ),
        )

    file_path = (
        damage_image.file_path
    )

    db.delete(
        damage_image
    )
    db.commit()

    if (
        file_path
        and os.path.exists(
            file_path
        )
    ):
        os.remove(
            file_path
        )

    return {
        "message":
            (
                "Damage image deleted "
                "successfully"
            )
    }


@app.delete(
    "/vehicles/{registration}/full"
)
def delete_vehicle_and_data(
    registration: str,
    db: Session = Depends(
        get_db
    ),
    current_user: UserDB = Depends(
        get_current_user
    ),
    workspace_id: int | None = Header(
        default=None,
        alias="X-Workspace-ID",
    ),
):
    vehicle = (
        get_vehicle_for_user(
            db,
            registration,
            current_user,
            workspace_id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    image_paths = [
        image.file_path
        for image
        in vehicle.damage_images
    ]

    db.delete(
        vehicle
    )
    db.commit()

    for file_path in (
        image_paths
    ):
        if (
            file_path
            and os.path.exists(
                file_path
            )
        ):
            os.remove(
                file_path
            )

    return {
        "message":
            (
                "Vehicle and associated "
                "data deleted successfully"
            )
    }