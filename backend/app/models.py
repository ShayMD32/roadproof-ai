from datetime import (
    datetime,
    timezone,
)

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from sqlalchemy.orm import (
    relationship,
)

from app.database import Base


class UserDB(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    full_name = Column(
        String,
        nullable=False,
    )

    # Platform-level role.
    #
    # user  = normal RoadProof account
    # admin = RoadProof platform administrator
    role = Column(
        String,
        nullable=False,
        default="user",
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )

    vehicles = relationship(
        "VehicleDB",
        back_populates="owner",
    )

    organisation_memberships = relationship(
        "OrganisationMembershipDB",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    created_organisations = relationship(
        "OrganisationDB",
        back_populates="created_by",
        foreign_keys=(
            "OrganisationDB.created_by_user_id"
        ),
    )

    audit_logs = relationship(
        "AuditLogDB",
        back_populates="actor",
        foreign_keys=(
            "AuditLogDB.actor_user_id"
        ),
    )


class OrganisationDB(Base):
    __tablename__ = "organisations"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    created_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )

    created_by = relationship(
        "UserDB",
        back_populates="created_organisations",
        foreign_keys=[
            created_by_user_id,
        ],
    )

    memberships = relationship(
        "OrganisationMembershipDB",
        back_populates="organisation",
        cascade="all, delete-orphan",
    )

    vehicles = relationship(
        "VehicleDB",
        back_populates="organisation",
    )

    audit_logs = relationship(
        "AuditLogDB",
        back_populates="organisation",
    )


class OrganisationMembershipDB(
    Base
):
    __tablename__ = (
        "organisation_memberships"
    )

    __table_args__ = (
        UniqueConstraint(
            "organisation_id",
            "user_id",
            name=(
                "uq_organisation_"
                "membership_user"
            ),
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    organisation_id = Column(
        Integer,
        ForeignKey(
            "organisations.id"
        ),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # Workspace-level role.
    #
    # owner  = workspace owner
    # admin  = workspace administrator
    # member = normal workspace member
    role = Column(
        String,
        nullable=False,
        default="member",
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )

    organisation = relationship(
        "OrganisationDB",
        back_populates="memberships",
    )

    user = relationship(
        "UserDB",
        back_populates=(
            "organisation_memberships"
        ),
    )


class VehicleDB(Base):
    __tablename__ = "vehicles"

    __table_args__ = (
        UniqueConstraint(
            "organisation_id",
            "registration",
            name=(
                "uq_vehicle_organisation_"
                "registration"
            ),
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    registration = Column(
        String,
        index=True,
        nullable=False,
    )

    make = Column(
        String,
        nullable=False,
    )

    model = Column(
        String,
        nullable=False,
    )

    year = Column(
        Integer,
        nullable=False,
    )

    # Existing Day 2 ownership field.
    #
    # Kept for creator/audit compatibility.
    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    # Day 3 workspace ownership.
    organisation_id = Column(
        Integer,
        ForeignKey(
            "organisations.id"
        ),
        nullable=True,
        index=True,
    )

    owner = relationship(
        "UserDB",
        back_populates="vehicles",
    )

    organisation = relationship(
        "OrganisationDB",
        back_populates="vehicles",
    )

    damage_images = relationship(
        "DamageImageDB",
        back_populates="vehicle",
        cascade="all, delete-orphan",
    )


class DamageImageDB(Base):
    __tablename__ = "damage_images"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    filename = Column(
        String,
        nullable=False,
    )

    file_path = Column(
        String,
        nullable=False,
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False,
    )

    vehicle = relationship(
        "VehicleDB",
        back_populates="damage_images",
    )

    inspections = relationship(
        "InspectionDB",
        back_populates="damage_image",
        cascade="all, delete-orphan",
    )


class InspectionDB(Base):
    __tablename__ = "inspections"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    damage_image_id = Column(
        Integer,
        ForeignKey("damage_images.id"),
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="pending",
    )

    damage_detected = Column(
        Boolean,
        nullable=True,
    )

    damage_count = Column(
        Integer,
        nullable=True,
    )

    highest_confidence = Column(
        Float,
        nullable=True,
    )

    severity = Column(
        String,
        nullable=True,
    )

    severity_score = Column(
        Integer,
        nullable=True,
    )

    severity_factors = Column(
        Text,
        nullable=True,
    )

    model_repository = Column(
        String,
        nullable=False,
    )

    model_checkpoint = Column(
        String,
        nullable=False,
    )

    confidence_threshold = Column(
        Float,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )

    damage_image = relationship(
        "DamageImageDB",
        back_populates="inspections",
    )

    detections = relationship(
        "DamageDetectionDB",
        back_populates="inspection",
        cascade="all, delete-orphan",
    )


class DamageDetectionDB(Base):
    __tablename__ = "damage_detections"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    inspection_id = Column(
        Integer,
        ForeignKey("inspections.id"),
        nullable=False,
    )

    damage_type = Column(
        String,
        nullable=False,
    )

    confidence = Column(
        Float,
        nullable=False,
    )

    x1 = Column(
        Float,
        nullable=False,
    )

    y1 = Column(
        Float,
        nullable=False,
    )

    x2 = Column(
        Float,
        nullable=False,
    )

    y2 = Column(
        Float,
        nullable=False,
    )

    segmentation = Column(
        Text,
        nullable=True,
    )

    inspection = relationship(
        "InspectionDB",
        back_populates="detections",
    )


class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    actor_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    organisation_id = Column(
        Integer,
        ForeignKey(
            "organisations.id"
        ),
        nullable=True,
        index=True,
    )

    action = Column(
        String,
        nullable=False,
        index=True,
    )

    entity_type = Column(
        String,
        nullable=False,
        index=True,
    )

    entity_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    details = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
        index=True,
    )

    actor = relationship(
        "UserDB",
        back_populates="audit_logs",
        foreign_keys=[
            actor_user_id,
        ],
    )

    organisation = relationship(
        "OrganisationDB",
        back_populates="audit_logs",
    )