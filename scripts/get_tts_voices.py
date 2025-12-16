# requirements:
# (none)

"""
Get available TTS voices for the frontend selector.
"""

from typing import TypedDict, List


class VoiceOption(TypedDict):
    key: str
    id: str
    name: str
    description: str


class VoicesResult(TypedDict):
    success: bool
    voices: List[VoiceOption]
    default_voice: str


# Curated voices for family document reading
VOICES = {
    "rachel": {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "description": "Warm, American female"},
    "drew": {"id": "29vD33N1CtxCmqQRPOHJ", "name": "Drew", "description": "Calm, American male"},
    "paul": {"id": "5Q0t7uMcjvnagumLfvZi", "name": "Paul", "description": "Mature, American male"},
    "sarah": {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah", "description": "Soft, American female"},
    "george": {"id": "JBFqnCBsd6RMkjVDRZzb", "name": "George", "description": "Warm, British male"},
    "emily": {"id": "LcfcDJNUP1GQjkzn1xUU", "name": "Emily", "description": "Calm, American female"},
    "dorothy": {"id": "ThT5KcBeYPX3keUQqHPh", "name": "Dorothy", "description": "Pleasant, British female"},
    "matilda": {"id": "XrExE9yKIg1WjnnlVkGX", "name": "Matilda", "description": "Warm, American female"},
    "daniel": {"id": "onwK4e9ZLuTAKqWW03F9", "name": "Daniel", "description": "Deep, British male"},
    "adam": {"id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "description": "Deep, American male"},
    "grace": {"id": "oWAxZDx7w5VEj9dCyTzz", "name": "Grace", "description": "Gentle, American female"},
}

DEFAULT_VOICE = "rachel"


def main() -> VoicesResult:
    """
    Get the list of available TTS voices.

    Returns a curated list of voices suitable for reading family documents.
    """
    voices = [
        {
            "key": key,
            "id": voice["id"],
            "name": voice["name"],
            "description": voice["description"],
        }
        for key, voice in VOICES.items()
    ]

    # Sort by name for consistent display
    voices.sort(key=lambda v: v["name"])

    return {
        "success": True,
        "voices": voices,
        "default_voice": DEFAULT_VOICE,
    }
