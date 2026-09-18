from app.services.inspection_service import (
    assess_inspection_confidence,
)


def test_high_confidence_damage_does_not_require_review():
    result = {
        "damage_detected": True,
        "highest_confidence": 0.86,
        "highest_candidate_confidence": 0.86,
        "weak_signal_count": 0,
    }

    review = assess_inspection_confidence(
        result,
        severity="moderate",
    )

    assert (
        review["inspection_confidence"]
        == "high"
    )

    assert (
        review["manual_review_required"]
        is False
    )

    assert (
        review["manual_review_reasons"]
        == []
    )


def test_medium_confidence_damage_does_not_require_review():
    result = {
        "damage_detected": True,
        "highest_confidence": 0.62,
        "highest_candidate_confidence": 0.62,
        "weak_signal_count": 0,
    }

    review = assess_inspection_confidence(
        result,
        severity="moderate",
    )

    assert (
        review["inspection_confidence"]
        == "medium"
    )

    assert (
        review["manual_review_required"]
        is False
    )


def test_low_confidence_damage_requires_review():
    result = {
        "damage_detected": True,
        "highest_confidence": 0.31,
        "highest_candidate_confidence": 0.31,
        "weak_signal_count": 0,
    }

    review = assess_inspection_confidence(
        result,
        severity="minor",
    )

    assert (
        review["inspection_confidence"]
        == "low"
    )

    assert (
        review["manual_review_required"]
        is True
    )

    assert len(
        review["manual_review_reasons"]
    ) > 0


def test_no_confirmed_damage_requires_review():
    result = {
        "damage_detected": False,
        "highest_confidence": None,
        "highest_candidate_confidence": None,
        "weak_signal_count": 0,
    }

    review = assess_inspection_confidence(
        result,
        severity="none",
    )

    assert (
        review["inspection_confidence"]
        == "low"
    )

    assert (
        review["manual_review_required"]
        is True
    )


def test_weak_signals_do_not_force_review_when_damage_is_strong():
    result = {
        "damage_detected": True,
        "highest_confidence": 0.92,
        "highest_candidate_confidence": 0.92,
        "weak_signal_count": 2,
    }

    review = assess_inspection_confidence(
        result,
        severity="severe",
    )

    assert (
        review["inspection_confidence"]
        == "high"
    )

    assert (
        review["manual_review_required"]
        is False
    )

    assert (
        review["weak_signal_count"]
        == 2
    )


def test_critical_severity_requires_manual_review():
    result = {
        "damage_detected": True,
        "highest_confidence": 0.92,
        "highest_candidate_confidence": 0.92,
        "weak_signal_count": 2,
    }

    review = assess_inspection_confidence(
        result,
        severity="critical",
    )

    assert (
        review["inspection_confidence"]
        == "high"
    )

    assert (
        review["manual_review_required"]
        is True
    )

    assert any(
        "critical" in reason.lower()
        for reason in review[
            "manual_review_reasons"
        ]
    )