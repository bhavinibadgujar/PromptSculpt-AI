from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(..., min_length=1, max_length=12000)


class PromptScores(BaseModel):
    model_config = ConfigDict(extra="forbid")

    clarity: int = Field(..., ge=0, le=20)
    specificity: int = Field(..., ge=0, le=20)
    context: int = Field(..., ge=0, le=20)
    constraints: int = Field(..., ge=0, le=20)
    output_format: int = Field(..., ge=0, le=20)


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overall_score: int = Field(..., ge=0, le=100)
    scores: PromptScores
    weaknesses: list[str]
    suggestions: list[str]
    improved_prompt: str

    @model_validator(mode="after")
    def overall_score_matches_criteria(self) -> Self:
        expected_score = sum(self.scores.model_dump().values())
        if self.overall_score != expected_score:
            self.overall_score = expected_score
        return self


class HistoryAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    overall_score: int = Field(..., ge=0, le=100)
    improved_prompt: str
    created_at: datetime