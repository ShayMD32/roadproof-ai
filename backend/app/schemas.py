from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)


class UserRegisterRequest(BaseModel):
    email: EmailStr

    password: str

    full_name: str


class UserLoginRequest(BaseModel):
    email: EmailStr

    password: str


class UserResponse(BaseModel):
    id: int

    email: EmailStr

    full_name: str

    is_active: bool

    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str

    token_type: str

    user: UserResponse


# ---------------------------------
# Organisations / workspaces
# ---------------------------------


class OrganisationCreateRequest(
    BaseModel
):
    name: str = Field(
        min_length=2,
        max_length=100,
    )


class OrganisationUpdateRequest(
    BaseModel
):
    name: str = Field(
        min_length=2,
        max_length=100,
    )


class OrganisationResponse(
    BaseModel
):
    id: int

    name: str

    created_by_user_id: int

    is_active: bool

    created_at: datetime


class OrganisationMembershipResponse(
    BaseModel
):
    id: int

    organisation_id: int

    user_id: int

    role: str

    created_at: datetime


class OrganisationMemberResponse(
    BaseModel
):
    membership_id: int

    user_id: int

    email: EmailStr

    full_name: str

    role: str

    joined_at: datetime


class OrganisationSummaryResponse(
    BaseModel
):
    id: int

    name: str

    role: str

    member_count: int

    vehicle_count: int

    created_at: datetime


class OrganisationMemberRoleUpdateRequest(
    BaseModel
):
    role: str


class OrganisationInviteRequest(
    BaseModel
):
    email: EmailStr

    role: str = "member"


# ---------------------------------
# Inspection/report schemas
# ---------------------------------


class VehicleReport(BaseModel):
    registration: str

    make: str

    model: str

    year: int


class ImageReport(BaseModel):
    id: int

    filename: str


class BoundingBox(BaseModel):
    x1: float

    y1: float

    x2: float

    y2: float


class DamageDetectionReport(
    BaseModel
):
    id: int

    damage_type: str

    confidence: float

    bounding_box: BoundingBox

    segmentation: list[
        dict[str, Any]
    ]


class ReviewSummary(BaseModel):
    inspection_confidence: str

    manual_review_required: bool

    manual_review_reasons: list[str]

    weak_signal_count: int

    highest_candidate_confidence: (
        float | None
    ) = None


class ModelThresholds(BaseModel):
    scan_threshold: float

    acceptance_threshold: float

    review_signal_threshold: float


class SeveritySummary(BaseModel):
    damage_detected: bool

    damage_count: int

    highest_confidence: (
        float | None
    ) = None

    severity: str | None = None

    severity_score: (
        float | None
    ) = None

    severity_factors: dict[
        str,
        Any,
    ]

    review: (
        ReviewSummary | None
    ) = None

    model_thresholds: (
        ModelThresholds | None
    ) = None


class ModelReport(BaseModel):
    repository: str

    checkpoint: str

    confidence_threshold: float


class InspectionReport(BaseModel):
    inspection_id: int

    created_at: datetime

    status: str

    vehicle: VehicleReport

    image: ImageReport

    summary: SeveritySummary

    detections: list[
        DamageDetectionReport
    ]

    model: ModelReport


class InspectionReportResponse(
    BaseModel
):
    report: InspectionReport


class VehicleInspectionSummary(
    BaseModel
):
    registration: str

    vehicle: VehicleReport

    total_images: int

    total_inspections: int

    damage_detected: bool

    total_damage_detections: int

    latest_severity: (
        str | None
    ) = None

    latest_severity_score: (
        float | None
    ) = None

    latest_inspection_id: (
        int | None
    ) = None

    latest_inspection_confidence: (
        str | None
    ) = None

    latest_manual_review_required: (
        bool | None
    ) = None