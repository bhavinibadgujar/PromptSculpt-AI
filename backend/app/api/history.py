from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.analysis import PromptAnalysis
from app.schemas.analysis import HistoryAnalysis

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=list[HistoryAnalysis])
def get_history(db: Session = Depends(get_db)) -> list[HistoryAnalysis]:
    analyses = db.scalars(
        select(PromptAnalysis).order_by(PromptAnalysis.created_at.desc(), PromptAnalysis.id.desc())
    ).all()
    return [
        HistoryAnalysis(
            id=analysis.id,
            prompt=analysis.prompt,
            overall_score=analysis.score,
            improved_prompt=analysis.improved_prompt,
            created_at=analysis.created_at,
        )
        for analysis in analyses
    ]


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(db: Session = Depends(get_db)) -> Response:
    db.execute(delete(PromptAnalysis))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)