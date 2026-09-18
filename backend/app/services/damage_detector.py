from pathlib import Path

from huggingface_hub import hf_hub_download
from ultralytics import YOLO


MODEL_REPO = (
    "harpreetsahota/"
    "car-dd-segmentation-yolov11"
)

MODEL_FILENAME = "best.pt"

# The model scans down to this level so RoadProof
# can see weak signals without treating them as
# confirmed damage.
SCAN_THRESHOLD = 0.01

# Detections must reach this confidence before
# RoadProof accepts them as actual damage.
ACCEPTANCE_THRESHOLD = 0.25

# Weak signals above this level can trigger
# manual review even if they are not accepted
# as confirmed damage.
REVIEW_SIGNAL_THRESHOLD = 0.05


class DamageDetector:
    def __init__(self):
        model_path = hf_hub_download(
            repo_id=MODEL_REPO,
            filename=MODEL_FILENAME,
        )

        self.model = YOLO(model_path)

    def analyse(
        self,
        image_path: str,
    ) -> dict:
        image = Path(image_path)

        if not image.exists():
            raise FileNotFoundError(
                f"Image not found: {image_path}"
            )

        results = self.model.predict(
            source=str(image),
            conf=SCAN_THRESHOLD,
            verbose=False,
        )

        accepted_detections = []
        weak_detections = []
        all_candidates = []

        for result in results:
            if result.boxes is None:
                continue

            boxes = result.boxes

            mask_polygons = None

            if result.masks is not None:
                mask_polygons = (
                    result.masks.xy
                )

            for index, box in enumerate(
                boxes
            ):
                class_id = int(
                    box.cls.item()
                )

                confidence = float(
                    box.conf.item()
                )

                x1, y1, x2, y2 = (
                    box.xyxy[0].tolist()
                )

                segmentation = []

                if (
                    mask_polygons is not None
                    and index
                    < len(mask_polygons)
                ):
                    polygon = (
                        mask_polygons[index]
                    )

                    segmentation = [
                        {
                            "x": round(
                                float(point[0]),
                                2,
                            ),
                            "y": round(
                                float(point[1]),
                                2,
                            ),
                        }
                        for point
                        in polygon
                    ]

                detection = {
                    "damage_type": (
                        self.model.names[
                            class_id
                        ]
                    ),
                    "confidence": round(
                        confidence,
                        4,
                    ),
                    "bounding_box": {
                        "x1": round(
                            x1,
                            2,
                        ),
                        "y1": round(
                            y1,
                            2,
                        ),
                        "x2": round(
                            x2,
                            2,
                        ),
                        "y2": round(
                            y2,
                            2,
                        ),
                    },
                    "segmentation": (
                        segmentation
                    ),
                }

                all_candidates.append(
                    detection
                )

                if (
                    confidence
                    >= ACCEPTANCE_THRESHOLD
                ):
                    accepted_detections.append(
                        detection
                    )

                elif (
                    confidence
                    >= REVIEW_SIGNAL_THRESHOLD
                ):
                    weak_detections.append(
                        detection
                    )

        highest_confidence = max(
            (
                detection["confidence"]
                for detection
                in accepted_detections
            ),
            default=None,
        )

        highest_candidate_confidence = max(
            (
                detection["confidence"]
                for detection
                in all_candidates
            ),
            default=None,
        )

        return {
            "damage_detected": (
                len(
                    accepted_detections
                ) > 0
            ),
            "damage_count": len(
                accepted_detections
            ),
            "highest_confidence": (
                highest_confidence
            ),
            "highest_candidate_confidence": (
                highest_candidate_confidence
            ),
            "weak_signal_count": len(
                weak_detections
            ),
            "weak_detections": (
                weak_detections
            ),
            "model": {
                "repository": MODEL_REPO,
                "checkpoint": (
                    MODEL_FILENAME
                ),
                "scan_threshold": (
                    SCAN_THRESHOLD
                ),
                "confidence_threshold": (
                    ACCEPTANCE_THRESHOLD
                ),
                "review_signal_threshold": (
                    REVIEW_SIGNAL_THRESHOLD
                ),
            },
            "detections": (
                accepted_detections
            ),
        }


damage_detector = DamageDetector()