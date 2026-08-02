from datetime import datetime
from typing import Literal, Self

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


class XRaySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overall_grade: str
    prompt_maturity: str
    top_three_risks: list[str]
    biggest_improvement_opportunity: str
    expected_ai_output_gain: str
    estimated_quality_increase: str
    estimated_token_efficiency: str


class XRayConfidence(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: int = Field(..., ge=0, le=100)
    reasons: list[str]


class XRayHighlight(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start: int = Field(..., ge=0)
    end: int = Field(..., ge=0)
    issue_type: Literal["ambiguous", "missing_context", "weak_constraints", "strong_section"]
    severity: Literal["critical", "high", "medium", "low"]
    explanation: str
    suggested_replacement: str
    impact: str
    expected_improvement: str
    title: str | None = None


class XRayAnalysis(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: XRaySummary
    confidence: XRayConfidence
    highlights: list[XRayHighlight]


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overall_score: int = Field(..., ge=0, le=100)
    scores: PromptScores
    weaknesses: list[str]
    suggestions: list[str]
    improved_prompt: str
    xray: XRayAnalysis | None = None

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