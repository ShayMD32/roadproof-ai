import json

from PIL import Image
from sqlalchemy.orm import Session

from app.models import (
    DamageImageDB,
    InspectionDB,
    DamageDetectionDB
)
from app.services.damage_detector import damage_detector
from app.services.severity_assessor import severity_assessor


def analyse_damage_image(
    image_id: int,
    db: Session
) -> InspectionDB:

    damage_image = db.query(DamageImageDB).filter(
        DamageImageDB.id == image_id
    ).first()

    if damage_image is None:
        raise ValueError("Damage image not found")

    inspection = InspectionDB(
        damage_image_id=damage_image.id,
        status="processing",
        model_repository="harpreetsahota/car-dd-segmentation-yolov11",
        model_checkpoint="best.pt",
        confidence_threshold=0.25
    )

    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    try:
        result = damage_detector.analyse(
            damage_image.file_path
        )

        inspection.damage_detected = result[
            "damage_detected"
        ]

        inspection.damage_count = result[
            "damage_count"
        ]

        inspection.highest_confidence = result[
            "highest_confidence"
        ]

        with Image.open(damage_image.file_path) as image:
            image_width, image_height = image.size

        severity_result = severity_assessor.assess(
            detections=result["detections"],
            image_width=image_width,
            image_height=image_height
        )

        inspection.severity = severity_result[
            "severity"
        ]

        inspection.severity_score = severity_result[
            "severity_score"
        ]

        inspection.severity_factors = json.dumps(
            severity_result["factors"]
        )

        for detection in result["detections"]:
            bounding_box = detection["bounding_box"]

            database_detection = DamageDetectionDB(
                inspection_id=inspection.id,
                damage_type=detection["damage_type"],
                confidence=detection["confidence"],
                x1=bounding_box["x1"],
                y1=bounding_box["y1"],
                x2=bounding_box["x2"],
                y2=bounding_box["y2"],
                segmentation=json.dumps(
                    detection["segmentation"]
                )
            )

            db.add(database_detection)

        inspection.status = "completed"

        db.commit()
        db.refresh(inspection)

        return inspection

    except Exception:
        inspection.status = "failed"

        db.commit()

        raise