from typing import Any


SEVERITY_LEVELS = {
    "minor": (0, 24),
    "moderate": (25, 49),
    "severe": (50, 74),
    "critical": (75, 100),
}


DAMAGE_TYPE_WEIGHTS = {
    "scratch": 8,
    "dent": 18,
    "crack": 15,
    "glass shatter": 25,
    "lamp broken": 25,
    "tire flat": 30,
}


class SeverityAssessor:
    def assess(
        self,
        detections: list[dict[str, Any]],
        image_width: int,
        image_height: int
    ) -> dict:

        if not detections:
            return {
                "severity": "none",
                "severity_score": 0,
                "factors": {
                    "damage_types": [],
                    "damage_count": 0,
                    "affected_area_percentage": 0.0
                }
            }

        image_area = image_width * image_height

        if image_area <= 0:
            raise ValueError(
                "Image dimensions must be greater than zero"
            )

        type_score = 0
        total_damage_area = 0.0
        damage_types = []

        for detection in detections:
            damage_type = detection["damage_type"]

            damage_types.append(damage_type)

            type_score = max(
                type_score,
                DAMAGE_TYPE_WEIGHTS.get(
                    damage_type,
                    15
                )
            )

            box = detection["bounding_box"]

            width = max(
                0,
                box["x2"] - box["x1"]
            )

            height = max(
                0,
                box["y2"] - box["y1"]
            )

            total_damage_area += width * height

        affected_area_percentage = min(
            (total_damage_area / image_area) * 100,
            100
        )

        area_score = self._calculate_area_score(
            affected_area_percentage
        )

        count_score = self._calculate_count_score(
            len(detections)
        )

        raw_score = (
            type_score
            + area_score
            + count_score
        )

        severity_score = min(
            round(raw_score),
            100
        )

        severity = self._score_to_level(
            severity_score
        )

        return {
            "severity": severity,
            "severity_score": severity_score,
            "factors": {
                "damage_types": sorted(
                    set(damage_types)
                ),
                "damage_count": len(detections),
                "affected_area_percentage": round(
                    affected_area_percentage,
                    2
                )
            }
        }

    @staticmethod
    def _calculate_area_score(
        affected_percentage: float
    ) -> int:

        if affected_percentage < 2:
            return 5

        if affected_percentage < 5:
            return 10

        if affected_percentage < 15:
            return 20

        if affected_percentage < 30:
            return 30

        return 40

    @staticmethod
    def _calculate_count_score(
        damage_count: int
    ) -> int:

        if damage_count <= 1:
            return 5

        if damage_count == 2:
            return 10

        if damage_count == 3:
            return 15

        return 20

    @staticmethod
    def _score_to_level(
        score: int
    ) -> str:

        for level, (
            minimum,
            maximum
        ) in SEVERITY_LEVELS.items():

            if minimum <= score <= maximum:
                return level

        return "critical"


severity_assessor = SeverityAssessor()