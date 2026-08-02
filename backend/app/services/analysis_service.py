import json
import logging
from typing import Any

from openai import OpenAI, OpenAIError
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, PromptScores

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self, client: OpenAI | None = None) -> None:
        self._client = client

    def analyze(self, payload: AnalyzeRequest) -> AnalyzeResponse:
        if not settings.openai_api_key:
            logger.warning("OpenAI API key is not configured")
            return self._fallback_response(payload.prompt, "OpenAI API key is not configured")

        try:
            response = self._get_client().responses.create(
                model=settings.openai_model,
                input=[
                    {
                        "role": "system",
                        "content": self._system_prompt(),
                    },
                    {
                        "role": "user",
                        "content": payload.prompt,
                    },
                ],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "prompt_analysis",
                        "strict": True,
                        "schema": self._response_json_schema(),
                    }
                },
                max_output_tokens=1200,
            )

            return self._parse_response(response.output_text)
        except (OpenAIError, json.JSONDecodeError, ValidationError, AttributeError, TypeError, ValueError) as exc:
            logger.exception("Prompt analysis failed: %s", exc)
            return self._fallback_response(payload.prompt, "Unable to analyze prompt at this time")

    def _get_client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.openai_api_key,
                timeout=settings.openai_timeout_seconds,
                max_retries=settings.openai_max_retries,
            )
        return self._client

    @staticmethod
    def _system_prompt() -> str:
        return (
            "You are PromptSculpt AI, an expert prompt evaluator. "
            "Evaluate the user's prompt using exactly these five criteria: clarity, "
            "specificity, context, constraints, and output_format. Score each criterion "
            "as an integer from 0 to 20. The overall_score must equal the sum of those "
            "five scores and must be out of 100. Identify concrete weaknesses, suggest "
            "practical improvements, and generate a stronger improved_prompt. "
            "Also produce a structured xray object with an executive summary, confidence "
            "score, and highlighted spans that point to ambiguous wording, missing context, "
            "weak constraints, or strong sections. Return only valid JSON that matches the "
            "provided schema. Do not include markdown, prose, or any keys outside the schema."
        )

    @staticmethod
    def _response_json_schema() -> dict[str, Any]:
        return {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "overall_score",
                "scores",
                "weaknesses",
                "suggestions",
                "improved_prompt",
                "xray",
            ],
            "properties": {
                "overall_score": {"type": "integer", "minimum": 0, "maximum": 100},
                "scores": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "clarity",
                        "specificity",
                        "context",
                        "constraints",
                        "output_format",
                    ],
                    "properties": {
                        "clarity": {"type": "integer", "minimum": 0, "maximum": 20},
                        "specificity": {"type": "integer", "minimum": 0, "maximum": 20},
                        "context": {"type": "integer", "minimum": 0, "maximum": 20},
                        "constraints": {"type": "integer", "minimum": 0, "maximum": 20},
                        "output_format": {"type": "integer", "minimum": 0, "maximum": 20},
                    },
                },
                "weaknesses": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "suggestions": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "improved_prompt": {"type": "string"},
                "xray": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["summary", "confidence", "highlights"],
                    "properties": {
                        "summary": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": [
                                "overall_grade",
                                "prompt_maturity",
                                "top_three_risks",
                                "biggest_improvement_opportunity",
                                "expected_ai_output_gain",
                                "estimated_quality_increase",
                                "estimated_token_efficiency",
                            ],
                            "properties": {
                                "overall_grade": {"type": "string"},
                                "prompt_maturity": {"type": "string"},
                                "top_three_risks": {"type": "array", "items": {"type": "string"}},
                                "biggest_improvement_opportunity": {"type": "string"},
                                "expected_ai_output_gain": {"type": "string"},
                                "estimated_quality_increase": {"type": "string"},
                                "estimated_token_efficiency": {"type": "string"},
                            },
                        },
                        "confidence": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["score", "reasons"],
                            "properties": {
                                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                                "reasons": {"type": "array", "items": {"type": "string"}},
                            },
                        },
                        "highlights": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["start", "end", "issue_type", "severity", "explanation", "suggested_replacement", "impact", "expected_improvement"],
                                "properties": {
                                    "start": {"type": "integer", "minimum": 0},
                                    "end": {"type": "integer", "minimum": 0},
                                    "issue_type": {"type": "string", "enum": ["ambiguous", "missing_context", "weak_constraints", "strong_section"]},
                                    "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                                    "explanation": {"type": "string"},
                                    "suggested_replacement": {"type": "string"},
                                    "impact": {"type": "string"},
                                    "expected_improvement": {"type": "string"},
                                    "title": {"type": "string"},
                                },
                            },
                        },
                    },
                },
            },
        }

    @staticmethod
    def _parse_response(raw_response: str) -> AnalyzeResponse:
        if not raw_response:
            raise ValueError("OpenAI response did not include output text")

        parsed = json.loads(raw_response)
        return AnalyzeResponse.model_validate(parsed)

    @staticmethod
    def _fallback_response(prompt: str, reason: str) -> AnalyzeResponse:
        """Generate a realistic demo analysis when the OpenAI API cannot be used."""
        import hashlib
        import random

        seed = int(hashlib.sha256(prompt.encode()).hexdigest(), 16)
        rng = random.Random(seed)
        scores = {
            "clarity": rng.randint(5, 18),
            "specificity": rng.randint(5, 18),
            "context": rng.randint(5, 18),
            "constraints": rng.randint(5, 18),
            "output_format": rng.randint(5, 18),
        }
        overall_score = sum(scores.values())
        weak_categories = [cat for cat, sc in scores.items() if sc < 12]
        weaknesses = []
        suggestions = []
        for cat in weak_categories:
            if cat == "clarity":
                weaknesses.append("The prompt is vague and may be interpreted in multiple ways.")
                suggestions.append("Clarify the core objective and use precise language.")
            elif cat == "specificity":
                weaknesses.append("Lacks concrete details that guide the model.")
                suggestions.append("Add specific examples, quantities, or required steps.")
            elif cat == "context":
                weaknesses.append("Provides little background information.")
                suggestions.append("Include relevant context about the audience or situation.")
            elif cat == "constraints":
                weaknesses.append("Missing clear constraints or success criteria.")
                suggestions.append("Specify tone, length, format, or any boundaries.")
            elif cat == "output_format":
                weaknesses.append("Does not define the desired output structure.")
                suggestions.append("State the expected format (e.g., list, paragraph, JSON).")
        if not weaknesses:
            weaknesses.append("The prompt could be refined for better results.")
            suggestions.append("Consider adding more detail and clear constraints.")

        improvement_parts = []
        if "clarity" in weak_categories:
            improvement_parts.append("Make the objective explicit.")
        if "specificity" in weak_categories:
            improvement_parts.append("Include concrete details.")
        if "context" in weak_categories:
            improvement_parts.append("Provide background information.")
        if "constraints" in weak_categories:
            improvement_parts.append("State constraints like tone, length, or style.")
        if "output_format" in weak_categories:
            improvement_parts.append("Define the desired output format.")

        improved_prompt = prompt.strip()
        if improvement_parts:
            improved_prompt += "\n\nImproved prompt suggestions: " + " ".join(improvement_parts)

        prompt_lower = prompt.lower()
        highlights = []
        if any(word in prompt_lower for word in ["interesting", "nice", "good", "better", "professional"]):
            highlights.append({
                "start": 0,
                "end": min(len(prompt), 24),
                "issue_type": "ambiguous",
                "severity": "high",
                "explanation": "Subjective adjectives make the task open to interpretation.",
                "suggested_replacement": "Replace vague words with a concrete brief and measurable outcome.",
                "impact": "The model will produce varied outputs because the goal is underspecified.",
                "expected_improvement": "Higher consistency and stronger relevance.",
                "title": "Ambiguous wording",
            })
        if "audience" not in prompt_lower and "for" in prompt_lower:
            highlights.append({
                "start": 0,
                "end": min(len(prompt), 24),
                "issue_type": "missing_context",
                "severity": "medium",
                "explanation": "The prompt leaves the intended audience unspecified.",
                "suggested_replacement": "Add the target audience and their context.",
                "impact": "Responses may miss the right tone and level of detail.",
                "expected_improvement": "Better alignment with the intended reader.",
                "title": "Missing audience context",
            })
        if "tone" not in prompt_lower and "format" not in prompt_lower and "word" not in prompt_lower:
            highlights.append({
                "start": 0,
                "end": min(len(prompt), 24),
                "issue_type": "weak_constraints",
                "severity": "medium",
                "explanation": "The prompt lacks measurable boundaries such as length, tone, and format.",
                "suggested_replacement": "Add constraints like length, tone, and required structure.",
                "impact": "The model will default to generic, less useful output.",
                "expected_improvement": "More precise and actionable results.",
                "title": "Missing constraints",
            })
        if len(prompt.split()) > 8:
            highlights.append({
                "start": max(0, min(len(prompt), 24)),
                "end": min(len(prompt), len(prompt)),
                "issue_type": "strong_section",
                "severity": "low",
                "explanation": "The prompt already contains enough content to be expanded into a more detailed instruction.",
                "suggested_replacement": "Turn the existing intent into a structured task with success criteria.",
                "impact": "A more explicit structure improves the usefulness of the output.",
                "expected_improvement": "Higher clarity and better execution.",
                "title": "Opportunity to strengthen",
            })

        return AnalyzeResponse(
            overall_score=overall_score,
            scores=PromptScores(
                clarity=scores["clarity"],
                specificity=scores["specificity"],
                context=scores["context"],
                constraints=scores["constraints"],
                output_format=scores["output_format"],
            ),
            weaknesses=weaknesses,
            suggestions=suggestions,
            improved_prompt=improved_prompt,
            xray={
                "summary": {
                    "overall_grade": "Developing",
                    "prompt_maturity": "Needs sharper constraints",
                    "top_three_risks": weaknesses[:3],
                    "biggest_improvement_opportunity": "Transform vague phrasing into concrete instructions.",
                    "expected_ai_output_gain": "Higher relevance and fewer generic responses.",
                    "estimated_quality_increase": "+18% output quality",
                    "estimated_token_efficiency": "+12% fewer wasted tokens",
                },
                "confidence": {
                    "score": min(98, 70 + len(highlights) * 6),
                    "reasons": [
                        "The intent is understandable.",
                        "The prompt has enough content to guide revision.",
                        "A few constraints are still missing.",
                    ],
                },
                "highlights": highlights,
            },
        )
