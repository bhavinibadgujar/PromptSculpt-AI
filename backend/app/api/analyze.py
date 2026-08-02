import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.analysis import PromptAnalysis
from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse
from app.services.analysis_service import AnalysisService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analyze"])
analysis_service = AnalysisService()


@router.post("", response_model=AnalyzeResponse)
def analyze_prompt(payload: AnalyzeRequest, db: Session = Depends(get_db)) -> AnalyzeResponse:
    result = analysis_service.analyze(payload)

    # Persist result — decoupled so a DB failure never swallows a successful analysis
    try:
        db.add(
            PromptAnalysis(
                prompt=payload.prompt,
                score=result.overall_score,
                summary="",
                improved_prompt=result.improved_prompt,
                strengths=[],                        # FIX: was incorrectly storing weaknesses
                suggestions=result.suggestions,
                metrics=result.scores.model_dump(),
            )
        )
        db.commit()
    except Exception:
        logger.exception("Failed to persist analysis — returning result anyway")
        db.rollback()

    return result