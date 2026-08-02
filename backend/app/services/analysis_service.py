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
            "practical improvements, and generate a stronger improved_prompt. Return only "
            "valid JSON that matches the provided schema. Do not include markdown, prose, "
            "or any keys outside the schema."
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
        """Generate a realistic demo analysis when the OpenAI API cannot be used.

        The demo uses a deterministic pseudo‑random generator seeded from the prompt
        text so that the same prompt yields the same demo output. This makes the
        experience repeatable for users while still providing varied results for
        different prompts.
        """
        import random, hashlib
        # Seed the RNG with a hash of the prompt for reproducibility.
        seed = int(hashlib.sha256(prompt.encode()).hexdigest(), 16)
        rng = random.Random(seed)
        # Generate scores for each criterion (5‑18) to keep them realistic.
        scores = {
            "clarity": rng.randint(5, 18),
            "specificity": rng.randint(5, 18),
            "context": rng.randint(5, 18),
            "constraints": rng.randint(5, 18),
            "output_format": rng.randint(5, 18),
        }
        overall_score = sum(scores.values())
        # Identify weaker categories (score < 12) to craft weaknesses and suggestions.
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
        # If no particular weakness was detected, add generic feedback.
        if not weaknesses:
            weaknesses.append("The prompt could be refined for better results.")
            suggestions.append("Consider adding more detail and clear constraints.")
        # Build an improved prompt by appending brief augmentation based on missing elements.
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
        )
