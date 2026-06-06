"""AI service: embeddings (OpenAI) and LLM features (Anthropic)."""

from __future__ import annotations

import base64
import logging
from typing import TYPE_CHECKING

import anthropic
import httpx
from openai import AsyncOpenAI

from app.core.config import settings

if TYPE_CHECKING:
    from app.models import Race, UserProfile

logger = logging.getLogger(__name__)

_openai_client: AsyncOpenAI | None = None
_anthropic_client: anthropic.AsyncAnthropic | None = None


def _openai() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def _anthropic() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _anthropic_client


async def embed_text(text: str) -> list[float]:
    """Return an embedding vector for an arbitrary text string."""
    response = await _openai().embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=text[:8191],  # max token limit guard
        dimensions=settings.EMBEDDING_DIMENSIONS,
    )
    return response.data[0].embedding


async def embed_race(race: "Race") -> list[float]:
    """Build a rich text representation of a race and embed it."""
    parts: list[str] = [race.name]
    if race.description:
        parts.append(race.description)
    if race.location:
        parts.append(f"Location: {race.location}")
    if race.terrain_type:
        parts.append(f"Terrain: {race.terrain_type}")
    if race.difficulty_level:
        parts.append(f"Difficulty: {race.difficulty_level}")
    if race.elevation_gain_m:
        parts.append(f"Elevation gain: {race.elevation_gain_m}m")
    text = " | ".join(parts)
    return await embed_text(text)


def _race_summary_block(race: "Race") -> str:
    lines = [f"Race: {race.name}"]
    if race.description:
        lines.append(f"Description: {race.description[:500]}")
    if race.location:
        lines.append(f"Location: {race.location}")
    if race.terrain_type:
        lines.append(f"Terrain: {race.terrain_type}")
    if race.difficulty_level:
        lines.append(f"Difficulty: {race.difficulty_level}")
    if race.elevation_gain_m:
        lines.append(f"Elevation gain: {race.elevation_gain_m}m")
    return "\n".join(lines)


async def generate_race_recommendation_explanation(
    race: "Race",
    profile: "UserProfile | None",
) -> str:
    """Return a 1-2 sentence explanation of why this race matches the user."""
    race_block = _race_summary_block(race)

    profile_lines: list[str] = []
    if profile:
        if profile.fitness_level:
            profile_lines.append(f"Fitness level: {profile.fitness_level.value}")
        if profile.distance_preference:
            profile_lines.append(f"Distance preference: {profile.distance_preference.value}")
        if profile.terrain_preference:
            profile_lines.append(f"Terrain preference: {profile.terrain_preference.value}")
    profile_block = "\n".join(profile_lines) if profile_lines else "No profile available."

    # System block is cacheable; user block contains dynamic profile.
    system_prompt = (
        "You are a race recommendation assistant for Vietnamese running events. "
        "Given a race's details and a runner's profile, write 1-2 sentences "
        "explaining why this race is a good match. Be specific and encouraging. "
        "Output only the explanation, no preamble."
    )

    response = await _anthropic().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": (
                    f"Race details:\n{race_block}\n\n"
                    f"Runner profile:\n{profile_block}\n\n"
                    "Why is this race a good match?"
                ),
            }
        ],
    )
    block = response.content[0]
    return block.text if hasattr(block, "text") else ""


async def enhance_race_description(race: "Race") -> str:
    """Suggest an improved description for a race (does not save)."""
    system_prompt = (
        "You are a copywriter for Vietnamese running event listings. "
        "Given a race's current details, write an engaging 2-3 paragraph description "
        "that highlights the unique experience, terrain, and challenge. "
        "Output only the description text."
    )

    response = await _anthropic().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": _race_summary_block(race),
            }
        ],
    )
    block = response.content[0]
    return block.text if hasattr(block, "text") else ""


async def suggest_race_tags(race: "Race") -> list[str]:
    """Return a list of suggested tag slugs for a race (does not save)."""
    system_prompt = (
        "You are a race categorization assistant. Given race details, "
        "suggest 3-7 short lowercase tag slugs (hyphenated, no spaces) "
        "that best describe this race. Examples: trail-running, mountainous, "
        "beginner-friendly, ultra-distance, night-race, scenic. "
        "Return only a JSON array of strings, nothing else."
    )

    response = await _anthropic().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": _race_summary_block(race),
            }
        ],
    )
    import json

    block = response.content[0]
    text = block.text if hasattr(block, "text") else "[]"
    try:
        tags = json.loads(text)
        return [str(t) for t in tags if isinstance(t, str)]
    except json.JSONDecodeError:
        logger.warning("suggest_race_tags: failed to parse JSON response: %s", text)
        return []


async def answer_race_question(race: "Race", question: str) -> str:
    """Answer a runner's question about a specific race."""
    race_block = _race_summary_block(race)

    system_prompt = (
        "You are a helpful assistant for Vietnamese running events. "
        "Answer the runner's question about the race using only the provided race details. "
        "If the answer is not in the race details, say so honestly. "
        "Be concise and friendly."
    )

    response = await _anthropic().messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": (
                    f"Race details:\n{race_block}\n\n"
                    f"Question: {question}"
                ),
            }
        ],
    )
    block = response.content[0]
    return block.text if hasattr(block, "text") else ""


async def generate_race_from_name(race_name: str) -> dict[str, str]:
    """
    Generate race details from just a race name using OpenAI.
    Returns a dictionary with suggested race fields.
    """
    import json

    system_prompt = (
        "You are an expert on Vietnamese running races and marathons. "
        "Given a race name, generate realistic and detailed information about what this race might be. "
        "Research real Vietnamese locations, terrains, and typical race characteristics. "
        "Return ONLY a JSON object with these fields (all strings): "
        "description, location, terrain_type (road/trail/track/mixed), "
        "difficulty_level (easy/moderate/hard/extreme), elevation_gain_m (number as string). "
        "Be specific and realistic for Vietnam. No extra text, only valid JSON."
    )

    try:
        response = await _openai().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Race name: {race_name}"}
            ],
            temperature=0.7,
            max_tokens=500,
        )
        
        content = response.choices[0].message.content
        if not content:
            return {}
        
        # Parse the JSON response
        data = json.loads(content)
        return data
    except json.JSONDecodeError:
        logger.warning("generate_race_from_name: failed to parse JSON response")
        return {}
    except Exception as e:
        logger.error("generate_race_from_name: error generating race details: %s", e)
        return {}


async def generate_race_image(race_name: str, location: str | None, image_type: str = "cover") -> bytes:
    """
    Generate a race cover or banner image using OpenAI gpt-image-2.
    Returns the image as bytes (PNG format).
    
    Args:
        race_name: Name of the race
        location: Location of the race (optional)
        image_type: Either 'cover' (square) or 'banner' (landscape)
    
    Returns:
        bytes: PNG image data
    """
    # gpt-image-2 supports 256x256, 512x512, 1024x1024
    # Using 1024x1024 for both cover and banner for best quality
    size = "1024x1024"
    
    location_text = f" in {location}" if location else " in Vietnam"
    
    # Build a descriptive prompt for the image
    if image_type == "banner":
        prompt = (
            f"A wide panoramic view of a running race event '{race_name}'{location_text}. "
            f"Professional sports photography showing runners on a scenic trail or road, "
            f"beautiful Vietnamese landscape in background, dynamic action, vibrant colors, "
            f"inspiring atmosphere, high quality, no text or words in image"
        )
    else:  # cover
        prompt = (
            f"A professional running race event poster for '{race_name}'{location_text}. "
            f"Show runners in action on a scenic Vietnamese trail or road with beautiful nature. "
            f"Dynamic motion, inspiring atmosphere, stunning landscape, square composition, "
            f"professional sports photography style, high quality, no text or words in image"
        )
    
    try:
        # Use OpenAI SDK to generate image with gpt-image-2
        result = await _openai().images.generate(
            model="gpt-image-2",
            prompt=prompt,
            size=size,
            output_format="jpeg",
            quality="medium",
            output_compression=80,     # type: ignore
            n=1
        )
        
        # Decode base64 image data
        image_base64 = result.data[0].b64_json
        if not image_base64:
            raise ValueError("No image data returned from OpenAI")
        
        image_bytes = base64.b64decode(image_base64)
        return image_bytes
            
    except Exception as e:
        logger.error("generate_race_image: error generating image: %s", e)
        raise

        return {}
    except Exception as e:
        logger.error("generate_race_from_name: error generating race details: %s", e)
        return {}
