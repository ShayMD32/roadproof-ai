import pytest

from app.services.severity_assessor import severity_assessor


def test_no_damage_returns_none():
    result = severity_assessor.assess(
        detections=[],
        image_width=1000,
        image_height=1000
    )

    assert result["severity"] == "none"
    assert result["severity_score"] == 0
    assert result["factors"]["damage_count"] == 0
    assert result["factors"]["affected_area_percentage"] == 0.0


def test_single_small_scratch_is_minor():
    detections = [
        {
            "damage_type": "scratch",
            "bounding_box": {
                "x1": 100,
                "y1": 100,
                "x2": 150,
                "y2": 150
            }
        }
    ]

    result = severity_assessor.assess(
        detections=detections,
        image_width=1000,
        image_height=1000
    )

    assert result["severity"] == "minor"
    assert result["severity_score"] == 18
    assert result["factors"]["damage_count"] == 1
    assert result["factors"]["affected_area_percentage"] == 0.25


def test_large_dent_is_severe():
    detections = [
        {
            "damage_type": "dent",
            "bounding_box": {
                "x1": 100,
                "y1": 100,
                "x2": 700,
                "y2": 700
            }
        }
    ]

    result = severity_assessor.assess(
        detections=detections,
        image_width=1000,
        image_height=1000
    )

    assert result["severity"] == "severe"
    assert result["severity_score"] == 63
    assert result["factors"]["affected_area_percentage"] == 36.0


def test_multiple_damage_types_increase_severity():
    detections = [
        {
            "damage_type": "dent",
            "bounding_box": {
                "x1": 100,
                "y1": 100,
                "x2": 500,
                "y2": 500
            }
        },
        {
            "damage_type": "lamp broken",
            "bounding_box": {
                "x1": 500,
                "y1": 100,
                "x2": 800,
                "y2": 400
            }
        },
        {
            "damage_type": "scratch",
            "bounding_box": {
                "x1": 100,
                "y1": 600,
                "x2": 700,
                "y2": 700
            }
        }
    ]

    result = severity_assessor.assess(
        detections=detections,
        image_width=1000,
        image_height=1000
    )

    assert result["severity"] == "critical"
    assert result["severity_score"] == 80

    assert result["factors"]["damage_count"] == 3

    assert result["factors"]["damage_types"] == [
        "dent",
        "lamp broken",
        "scratch"
    ]

    assert result["factors"]["affected_area_percentage"] == 31.0


def test_invalid_image_dimensions_raise_error():
    detections = [
        {
            "damage_type": "dent",
            "bounding_box": {
                "x1": 10,
                "y1": 10,
                "x2": 100,
                "y2": 100
            }
        }
    ]

    with pytest.raises(
        ValueError,
        match="Image dimensions must be greater than zero"
    ):
        severity_assessor.assess(
            detections=detections,
            image_width=0,
            image_height=1000
        )