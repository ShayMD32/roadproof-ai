from pathlib import Path

from huggingface_hub import hf_hub_download
from ultralytics import YOLO


MODEL_REPO = "harpreetsahota/car-dd-segmentation-yolov11"
MODEL_FILENAME = "best.pt"

CONFIDENCE_THRESHOLD = 0.25


class DamageDetector:
    def __init__(self):
        model_path = hf_hub_download(
            repo_id=MODEL_REPO,
            filename=MODEL_FILENAME
        )

        self.model = YOLO(model_path)

    def analyse(self, image_path: str) -> dict:
        image = Path(image_path)

        if not image.exists():
            raise FileNotFoundError(
                f"Image not found: {image_path}"
            )

        results = self.model.predict(
            source=str(image),
            conf=CONFIDENCE_THRESHOLD,
            verbose=False
        )

        detections = []

        for result in results:
            if result.boxes is None:
                continue

            boxes = result.boxes

            # Segmentation polygons are available when the model
            # successfully produces masks for detected damage.
            mask_polygons = None

            if result.masks is not None:
                mask_polygons = result.masks.xy

            for index, box in enumerate(boxes):
                class_id = int(box.cls.item())
                confidence = float(box.conf.item())

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                segmentation = []

                if (
                    mask_polygons is not None
                    and index < len(mask_polygons)
                ):
                    polygon = mask_polygons[index]

                    segmentation = [
                        {
                            "x": round(float(point[0]), 2),
                            "y": round(float(point[1]), 2)
                        }
                        for point in polygon
                    ]

                detection = {
                    "damage_type": self.model.names[class_id],
                    "confidence": round(confidence, 4),
                    "bounding_box": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2)
                    },
                    "segmentation": segmentation
                }

                detections.append(detection)

        highest_confidence = max(
            (
                detection["confidence"]
                for detection in detections
            ),
            default=None
        )

        return {
            "damage_detected": len(detections) > 0,
            "damage_count": len(detections),
            "highest_confidence": highest_confidence,
            "model": {
                "repository": MODEL_REPO,
                "checkpoint": MODEL_FILENAME,
                "confidence_threshold": CONFIDENCE_THRESHOLD
            },
            "detections": detections
        }


damage_detector = DamageDetector()