from pathlib import Path

import torch
from PIL import Image
from transformers import (
    CLIPModel,
    CLIPProcessor,
)


MODEL_NAME = (
    "openai/clip-vit-base-patch32"
)

DAMAGE_PRESENCE_THRESHOLD = 0.60


class DamagePresenceClassifier:
    def __init__(self):
        self.model = None
        self.processor = None

    def _load_model(self):
        if self.model is not None:
            return

        self.model = (
            CLIPModel.from_pretrained(
                MODEL_NAME
            )
        )

        self.processor = (
            CLIPProcessor.from_pretrained(
                MODEL_NAME
            )
        )

        self.model.eval()

    def analyse(
        self,
        image_path: str,
    ) -> dict:
        image_file = Path(
            image_path
        )

        if not image_file.exists():
            raise FileNotFoundError(
                f"Image not found: "
                f"{image_path}"
            )

        self._load_model()

        prompts = [
            "a photo of a damaged vehicle",
            "a photo of a crashed vehicle",
            "a photo of an undamaged vehicle",
            "a photo of an intact vehicle",
        ]

        with Image.open(
            image_file
        ) as image:
            rgb_image = image.convert(
                "RGB"
            )

            inputs = self.processor(
                text=prompts,
                images=rgb_image,
                return_tensors="pt",
                padding=True,
            )

        with torch.no_grad():
            outputs = self.model(
                **inputs
            )

        probabilities = (
            outputs.logits_per_image
            .softmax(dim=1)[0]
            .tolist()
        )

        damaged_score = (
            probabilities[0]
            + probabilities[1]
        )

        intact_score = (
            probabilities[2]
            + probabilities[3]
        )

        total_score = (
            damaged_score
            + intact_score
        )

        if total_score > 0:
            damaged_score /= (
                total_score
            )

            intact_score /= (
                total_score
            )

        damage_likely = (
            damaged_score
            >= DAMAGE_PRESENCE_THRESHOLD
        )

        return {
            "damage_likely": (
                damage_likely
            ),
            "damage_signal_score": round(
                damaged_score,
                4,
            ),
            "intact_signal_score": round(
                intact_score,
                4,
            ),
            "threshold": (
                DAMAGE_PRESENCE_THRESHOLD
            ),
            "model": MODEL_NAME,
        }


damage_presence_classifier = (
    DamagePresenceClassifier()
)