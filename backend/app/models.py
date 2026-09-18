from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

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


class VehicleDB(Base):
    __tablename__ = "vehicles"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    registration = Column(
        String,
        unique=True,
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