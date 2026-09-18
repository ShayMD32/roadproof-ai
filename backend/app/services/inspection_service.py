import json

from PIL import Image
from sqlalchemy.orm import Session

from app.models import (
    DamageImageDB,
    InspectionDB,
    DamageDetectionDB,
)

from app.services.damage_detector import (
    damage_detector,
)

from app.services.damage_presence_classifier import (
    damage_presence_classifier,
)

from app.services.severity_assessor import (
    severity_assessor,
)


def assess_inspection_confidence(
    result: dict,
    severity: str | None = None,
) -> dict:
    damage_detected = result[
        "damage_detected"
    ]

    highest_confidence = result[
        "highest_confidence"
    ]

    highest_candidate_confidence = (
        result[
            "highest_candidate_confidence"
        ]
    )

    weak_signal_count = result[
        "weak_signal_count"
    ]

    manual_review_required = False

    reasons = []

    inspection_confidence = "low"

    if not damage_detected:
        manual_review_required = True

        inspection_confidence = "low"

        reasons.append(
            "No damage detections met the "
            "acceptance threshold. The AI "
            "cannot confirm that the vehicle "
            "is damage-free."
        )

        if weak_signal_count > 0:
            reasons.append(
                "Low-confidence damage signals "
                "were detected below the "
                "acceptance threshold."
            )

    elif (
        highest_confidence is not None
        and highest_confidence >= 0.75
    ):
        inspection_confidence = "high"

    elif (
        highest_confidence is not None
        and highest_confidence >= 0.50
    ):
        inspection_confidence = "medium"

    else:
        inspection_confidence = "low"

        manual_review_required = True

        reasons.append(
            "Accepted damage was detected, "
            "but model confidence is low."
        )

    if severity == "critical":
        manual_review_required = True

        reasons.append(
            "The AI severity estimate is "
            "critical, so human review is "
            "required."
        )

    return {
        "inspection_confidence": (
            inspection_confidence
        ),
        "manual_review_required": (
            manual_review_required
        ),
        "manual_review_reasons": reasons,
        "weak_signal_count": (
            weak_signal_count
        ),
        "highest_candidate_confidence": (
            highest_candidate_confidence
        ),
    }


def analyse_damage_image(
    image_id: int,
    db: Session,
) -> InspectionDB:
    damage_image = db.query(
        DamageImageDB
    ).filter(
        DamageImageDB.id == image_id
    ).first()

    if damage_image is None:
        raise ValueError(
            "Damage image not found"
        )

    inspection = InspectionDB(
        damage_image_id=damage_image.id,
        status="processing",
        model_repository=(
            "harpreetsahota/"
            "car-dd-segmentation-yolov11"
        ),
        model_checkpoint="best.pt",
        confidence_threshold=0.25,
    )

    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    try:
        result = damage_detector.analyse(
            damage_image.file_path
        )

        presence_result = (
            damage_presence_classifier.analyse(
                damage_image.file_path
            )
        )

        inspection.damage_detected = (
            result["damage_detected"]
        )

        inspection.damage_count = (
            result["damage_count"]
        )

        inspection.highest_confidence = (
            result["highest_confidence"]
        )

        inspection.model_repository = (
            result["model"]["repository"]
        )

        inspection.model_checkpoint = (
            result["model"]["checkpoint"]
        )

        inspection.confidence_threshold = (
            result["model"][
                "confidence_threshold"
            ]
        )

        with Image.open(
            damage_image.file_path
        ) as image:
            (
                image_width,
                image_height,
            ) = image.size

        severity_result = (
            severity_assessor.assess(
                detections=(
                    result["detections"]
                ),
                image_width=image_width,
                image_height=image_height,
            )
        )

        inspection.severity = (
            severity_result[
                "severity"
            ]
        )

        inspection.severity_score = (
            severity_result[
                "severity_score"
            ]
        )

        review_result = (
            assess_inspection_confidence(
                result,
                severity=(
                    severity_result[
                        "severity"
                    ]
                ),
            )
        )

        if (
            presence_result[
                "damage_likely"
            ]
            and not result[
                "damage_detected"
            ]
        ):
            review_result[
                "manual_review_required"
            ] = True

            review_result[
                "manual_review_reasons"
            ].append(
                "The image-level damage "
                "classifier detected likely "
                "vehicle damage, but the "
                "segmentation model did not "
                "produce an accepted damage "
                "detection."
            )

        severity_factors = {
            **severity_result[
                "factors"
            ],

            "review": review_result,

            "damage_presence": (
                presence_result
            ),

            "model_thresholds": {
                "scan_threshold": (
                    result["model"][
                        "scan_threshold"
                    ]
                ),

                "acceptance_threshold": (
                    result["model"][
                        "confidence_threshold"
                    ]
                ),

                "review_signal_threshold": (
                    result["model"][
                        "review_signal_threshold"
                    ]
                ),
            },
        }

        inspection.severity_factors = (
            json.dumps(
                severity_factors
            )
        )

        for detection in result[
            "detections"
        ]:
            bounding_box = detection[
                "bounding_box"
            ]

            database_detection = (
                DamageDetectionDB(
                    inspection_id=(
                        inspection.id
                    ),
                    damage_type=(
                        detection[
                            "damage_type"
                        ]
                    ),
                    confidence=(
                        detection[
                            "confidence"
                        ]
                    ),
                    x1=bounding_box[
                        "x1"
                    ],
                    y1=bounding_box[
                        "y1"
                    ],
                    x2=bounding_box[
                        "x2"
                    ],
                    y2=bounding_box[
                        "y2"
                    ],
                    segmentation=json.dumps(
                        detection[
                            "segmentation"
                        ]
                    ),
                )
            )

            db.add(
                database_detection
            )

        inspection.status = (
            "completed"
        )

        db.commit()
        db.refresh(inspection)

        return inspection

    except Exception:
        inspection.status = (
            "failed"
        )

        db.commit()

        raise