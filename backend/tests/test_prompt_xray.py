from app.schemas.analysis import AnalyzeRequest
from app.services.analysis_service import AnalysisService


def test_fallback_response_contains_xray_payload() -> None:
    service = AnalysisService()
    response = service._fallback_response("Write something interesting", "demo")

    assert response.xray is not None
    assert response.xray.summary.overall_grade
    assert response.xray.summary.prompt_maturity
    assert response.xray.confidence.score >= 0
    assert response.xray.highlights
    assert response.xray.highlights[0].issue_type in {"ambiguous", "missing_context", "weak_constraints", "strong_section"}
