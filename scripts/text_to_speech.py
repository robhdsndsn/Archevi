# requirements:
# requests

"""
ElevenLabs Text-to-Speech Script for Archevi

Converts document text to speech using ElevenLabs API.
Returns base64-encoded audio for playback in the frontend.
"""

import wmill
import requests
import base64
from typing import TypedDict, Optional


class TTSResult(TypedDict):
    success: bool
    audio_base64: Optional[str]
    audio_format: str
    voice_id: str
    voice_name: str
    text_length: int
    error: Optional[str]


# Available voices - curated selection for family document reading
VOICES = {
    "rachel": {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "description": "Warm, American female"},
    "drew": {"id": "29vD33N1CtxCmqQRPOHJ", "name": "Drew", "description": "Calm, American male"},
    "clyde": {"id": "2EiwWnXFnvU5JabPnv8n", "name": "Clyde", "description": "Deep, American male"},
    "paul": {"id": "5Q0t7uMcjvnagumLfvZi", "name": "Paul", "description": "Mature, American male"},
    "domi": {"id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi", "description": "Strong, American female"},
    "dave": {"id": "CYw3kZ02Hs0563khs1Fj", "name": "Dave", "description": "Conversational, British male"},
    "fin": {"id": "D38z5RcWu1voky8WS1ja", "name": "Fin", "description": "Irish male"},
    "sarah": {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah", "description": "Soft, American female"},
    "antoni": {"id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "description": "Warm, American male"},
    "thomas": {"id": "GBv7mTt0atIp3Br8iCZE", "name": "Thomas", "description": "Calm, American male"},
    "charlie": {"id": "IKne3meq5aSn9XLyUdCD", "name": "Charlie", "description": "Friendly, Australian male"},
    "george": {"id": "JBFqnCBsd6RMkjVDRZzb", "name": "George", "description": "Warm, British male"},
    "emily": {"id": "LcfcDJNUP1GQjkzn1xUU", "name": "Emily", "description": "Calm, American female"},
    "elli": {"id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli", "description": "Cheerful, American female"},
    "callum": {"id": "N2lVS1w4EtoT3dr4eOWO", "name": "Callum", "description": "Intense, Transatlantic male"},
    "patrick": {"id": "ODq5zmih8GrVes37Dizd", "name": "Patrick", "description": "Shouty, American male"},
    "harry": {"id": "SOYHLrjzK2X1ezoPC6cr", "name": "Harry", "description": "Anxious, American male"},
    "liam": {"id": "TX3LPaxmHKxFdv7VOQHJ", "name": "Liam", "description": "Articulate, American male"},
    "dorothy": {"id": "ThT5KcBeYPX3keUQqHPh", "name": "Dorothy", "description": "Pleasant, British female"},
    "josh": {"id": "TxGEqnHWrfWFTfGW9XjX", "name": "Josh", "description": "Deep, American male"},
    "arnold": {"id": "VR6AewLTigWG4xSOukaG", "name": "Arnold", "description": "Crisp, American male"},
    "charlotte": {"id": "XB0fDUnXU5powFXDhCwa", "name": "Charlotte", "description": "Swedish female"},
    "matilda": {"id": "XrExE9yKIg1WjnnlVkGX", "name": "Matilda", "description": "Warm, American female"},
    "james": {"id": "ZQe5CZNOzWyzPSCn5a3c", "name": "James", "description": "Australian male"},
    "joseph": {"id": "Zlb1dXrM653N07WRdFW3", "name": "Joseph", "description": "British male"},
    "jessica": {"id": "cgSgspJ2msm6clMCkdW9", "name": "Jessica", "description": "Expressive, American female"},
    "michael": {"id": "flq6f7yk4E4fJM5XTYuZ", "name": "Michael", "description": "Calm, American male"},
    "ethan": {"id": "g5CIjZEefAph4nQFvHAz", "name": "Ethan", "description": "American male ASMR"},
    "gigi": {"id": "jBpfuIE2acCO8z3wKNLl", "name": "Gigi", "description": "Childish, American female"},
    "freya": {"id": "jsCqWAovK2LkecY7zXl4", "name": "Freya", "description": "Overhyped, American female"},
    "grace": {"id": "oWAxZDx7w5VEj9dCyTzz", "name": "Grace", "description": "Gentle, American female"},
    "daniel": {"id": "onwK4e9ZLuTAKqWW03F9", "name": "Daniel", "description": "Deep, British male"},
    "serena": {"id": "pMsXgVXv3BLzUgSXRplE", "name": "Serena", "description": "Pleasant, American female"},
    "adam": {"id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "description": "Deep, American male"},
    "nicole": {"id": "piTKgcLEGmPE4e6mEKli", "name": "Nicole", "description": "Whispery, American female"},
    "glinda": {"id": "z9fAnlkpzviPz146aGWa", "name": "Glinda", "description": "Witch, American female"},
    "mimi": {"id": "zrHiDhphv9ZnVXBqCLjz", "name": "Mimi", "description": "Swedish female"},
}

# Default voices by use case
DEFAULT_VOICE = "rachel"  # Warm, American female - good for document reading


def main(
    text: str,
    voice_key: str = DEFAULT_VOICE,
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75,
    style: float = 0.0,
    use_speaker_boost: bool = True,
    output_format: str = "mp3_44100_128",
) -> TTSResult:
    """
    Convert text to speech using ElevenLabs API.

    Args:
        text: The text to convert to speech (max ~5000 chars recommended)
        voice_key: Key from VOICES dict (e.g., 'rachel', 'george')
        model_id: ElevenLabs model (eleven_multilingual_v2, eleven_turbo_v2_5, eleven_flash_v2_5)
        stability: Voice stability (0.0-1.0). Lower = more expressive, higher = more consistent
        similarity_boost: Voice similarity (0.0-1.0). Higher = closer to original voice
        style: Style exaggeration (0.0-1.0). Higher = more stylized
        use_speaker_boost: Enhance voice clarity
        output_format: Audio format (mp3_44100_128, mp3_22050_32, pcm_16000, etc.)

    Returns:
        TTSResult with base64 audio or error
    """

    # Validate voice
    if voice_key not in VOICES:
        return {
            "success": False,
            "audio_base64": None,
            "audio_format": output_format,
            "voice_id": "",
            "voice_name": "",
            "text_length": len(text),
            "error": f"Invalid voice key '{voice_key}'. Available: {', '.join(VOICES.keys())}",
        }

    voice = VOICES[voice_key]
    voice_id = voice["id"]

    # Validate text length (ElevenLabs has limits)
    if len(text) > 10000:
        return {
            "success": False,
            "audio_base64": None,
            "audio_format": output_format,
            "voice_id": voice_id,
            "voice_name": voice["name"],
            "text_length": len(text),
            "error": "Text too long. Maximum 10,000 characters.",
        }

    if not text.strip():
        return {
            "success": False,
            "audio_base64": None,
            "audio_format": output_format,
            "voice_id": voice_id,
            "voice_name": voice["name"],
            "text_length": 0,
            "error": "Text is empty.",
        }

    try:
        # Get ElevenLabs API key from Windmill
        api_key = wmill.get_variable("f/chatbot/elevenlabs_api_key")

        # Make TTS request
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key,
        }

        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
                "style": style,
                "use_speaker_boost": use_speaker_boost,
            },
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            params={"output_format": output_format},
            timeout=60,  # TTS can take time for long text
        )

        if response.status_code == 200:
            # Success - encode audio as base64
            audio_base64 = base64.b64encode(response.content).decode("utf-8")

            return {
                "success": True,
                "audio_base64": audio_base64,
                "audio_format": output_format,
                "voice_id": voice_id,
                "voice_name": voice["name"],
                "text_length": len(text),
                "error": None,
            }
        elif response.status_code == 401:
            return {
                "success": False,
                "audio_base64": None,
                "audio_format": output_format,
                "voice_id": voice_id,
                "voice_name": voice["name"],
                "text_length": len(text),
                "error": "Invalid ElevenLabs API key.",
            }
        elif response.status_code == 422:
            error_detail = response.json().get("detail", {})
            return {
                "success": False,
                "audio_base64": None,
                "audio_format": output_format,
                "voice_id": voice_id,
                "voice_name": voice["name"],
                "text_length": len(text),
                "error": f"Validation error: {error_detail}",
            }
        else:
            return {
                "success": False,
                "audio_base64": None,
                "audio_format": output_format,
                "voice_id": voice_id,
                "voice_name": voice["name"],
                "text_length": len(text),
                "error": f"ElevenLabs API error: {response.status_code} - {response.text[:200]}",
            }

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "audio_base64": None,
            "audio_format": output_format,
            "voice_id": voice_id,
            "voice_name": voice["name"],
            "text_length": len(text),
            "error": "Request timed out. Text may be too long.",
        }
    except Exception as e:
        return {
            "success": False,
            "audio_base64": None,
            "audio_format": output_format,
            "voice_id": voice_id if 'voice_id' in dir() else "",
            "voice_name": voice["name"] if 'voice' in dir() else "",
            "text_length": len(text),
            "error": f"Error: {str(e)}",
        }
