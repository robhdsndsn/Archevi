# transcribe_voice_note.py
# Windmill Python script for voice note transcription and embedding
# Path: f/chatbot/transcribe_voice_note
#
# requirements:
#   - groq
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
Transcribe a voice note using Groq Whisper and embed it for RAG queries.

Groq Whisper is ~50% cheaper than OpenAI Whisper ($0.0028/min vs $0.006/min)
and significantly faster due to Groq's LPU inference.

Args:
    audio_content (str): Base64-encoded audio file content
    filename (str): Original filename for reference
    title (str, optional): Title for the voice note (auto-generated if not provided)
    created_by (str, optional): User who created the voice note

Returns:
    dict: {
        voice_note_id: int,
        transcript: str,
        duration_seconds: int,
        language: str,
        title: str,
        tags: list[str],
        tokens_used: int,
        transcription_cost: float,
        embedding_cost: float
    }
"""

import base64
import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional
import wmill
import json
import re
import tempfile
import os

# Try to import groq, fall back to requests if not available
try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False
    import requests


def transcribe_with_groq(audio_bytes: bytes, groq_api_key: str, filename: str) -> dict:
    """
    Transcribe audio using Groq's Whisper API.
    Groq uses whisper-large-v3-turbo for fast, accurate transcription.
    """
    if HAS_GROQ:
        client = Groq(api_key=groq_api_key)

        # Save to temp file (Groq SDK requires file path)
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as f:
            f.write(audio_bytes)
            temp_path = f.name

        try:
            with open(temp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(filename, audio_file),
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json",  # Get word timestamps and language
                    language=None,  # Auto-detect
                )

            return {
                "success": True,
                "text": transcription.text,
                "language": getattr(transcription, 'language', 'en'),
                "duration": getattr(transcription, 'duration', 0),
            }
        finally:
            os.unlink(temp_path)
    else:
        # Fallback to requests
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {groq_api_key}"}

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as f:
            f.write(audio_bytes)
            temp_path = f.name

        try:
            with open(temp_path, "rb") as audio_file:
                files = {"file": (filename, audio_file)}
                data = {
                    "model": "whisper-large-v3-turbo",
                    "response_format": "verbose_json"
                }
                response = requests.post(url, headers=headers, files=files, data=data)
                response.raise_for_status()
                result = response.json()

            return {
                "success": True,
                "text": result.get("text", ""),
                "language": result.get("language", "en"),
                "duration": result.get("duration", 0),
            }
        finally:
            os.unlink(temp_path)


def generate_title(transcript: str, co: cohere.ClientV2) -> str:
    """Generate a concise title for the voice note based on its content."""
    if len(transcript) < 50:
        return transcript[:50]

    try:
        response = co.chat(
            model="command-r7b-12-2024",
            messages=[{
                "role": "user",
                "content": f"""Generate a concise 3-6 word title for this voice note transcript.
Return ONLY the title, nothing else.

Transcript:
{transcript[:500]}"""
            }]
        )
        title = response.message.content[0].text.strip()
        # Clean up the title
        title = title.strip('"\'')
        return title[:100]  # Max 100 chars
    except Exception:
        # Fallback: use first sentence or 50 chars
        first_sentence = transcript.split('.')[0][:50]
        return first_sentence if first_sentence else "Voice Note"


def extract_tags(transcript: str, co: cohere.ClientV2) -> list:
    """Extract relevant tags from the transcript."""
    try:
        response = co.chat(
            model="command-r7b-12-2024",
            messages=[{
                "role": "user",
                "content": f"""Extract 2-4 relevant tags for this voice note. Return ONLY a JSON array.

Transcript:
{transcript[:1000]}

Return format: ["tag1", "tag2"]"""
            }]
        )

        response_text = response.message.content[0].text.strip()
        match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if match:
            tags = json.loads(match.group())
            return [t.lower().strip() for t in tags if isinstance(t, str)][:4]
    except Exception:
        pass

    return []


def main(
    audio_content: str,
    filename: str = "voice_note.webm",
    title: Optional[str] = None,
    created_by: Optional[str] = None,
) -> dict:
    """
    Transcribe and embed a voice note for the knowledge base.
    """
    if not audio_content:
        raise ValueError("Audio content cannot be empty")

    # Fetch resources from Windmill
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Try to get Groq API key, fall back to OpenAI if not available
    try:
        groq_api_key = wmill.get_variable("f/chatbot/groq_api_key")
    except Exception:
        raise RuntimeError("Groq API key not configured. Please add 'groq_api_key' variable.")

    # Decode audio content
    try:
        if audio_content.startswith("data:"):
            audio_content = audio_content.split(",", 1)[1]
        audio_bytes = base64.b64decode(audio_content)
    except Exception as e:
        raise ValueError(f"Invalid base64 audio content: {str(e)}")

    # Estimate duration from file size (rough approximation)
    # WebM/Opus is typically ~12KB per second
    estimated_duration = len(audio_bytes) / 12000

    # Transcribe using Groq Whisper
    transcription = transcribe_with_groq(audio_bytes, groq_api_key, filename)

    if not transcription["success"]:
        raise RuntimeError(f"Transcription failed: {transcription.get('error', 'Unknown error')}")

    transcript = transcription["text"]
    duration = transcription.get("duration", estimated_duration)
    language = transcription.get("language", "en")

    if not transcript or not transcript.strip():
        raise ValueError("No speech detected in audio")

    # Calculate transcription cost ($0.0028 per minute for Groq)
    transcription_cost = (duration / 60) * 0.0028

    # Initialize Cohere for embedding and title generation
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Generate title if not provided
    final_title = title if title else generate_title(transcript, co)

    # Extract tags
    tags = extract_tags(transcript, co)

    # Generate embedding for the transcript
    try:
        response = co.embed(
            texts=[transcript],
            model="embed-v4.0",
            input_type="search_document",
            embedding_types=["float"],
            output_dimension=1024
        )
        embedding = response.embeddings.float_[0]
        tokens_used = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else len(transcript.split())
    except Exception as e:
        raise RuntimeError(f"Embedding failed: {str(e)}")

    embedding_cost = tokens_used * 0.0000001

    # Store in database
    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        register_vector(conn)
        cursor = conn.cursor()

        # Prepare metadata
        metadata = {
            "tags": tags,
            "source": "voice_note",
            "original_filename": filename
        }

        # Insert voice note
        cursor.execute("""
            INSERT INTO voice_notes (
                title, transcript, duration_seconds, language,
                transcription_model, embedding, created_by, metadata
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            final_title, transcript, int(duration), language,
            "whisper-large-v3-turbo", embedding, created_by, json.dumps(metadata)
        ))

        voice_note_id = cursor.fetchone()[0]

        # Log API usage
        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('transcribe', %s, %s)
        """, (int(duration * 100), transcription_cost))  # Using duration*100 as "tokens" for tracking

        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('embed', %s, %s)
        """, (tokens_used, embedding_cost))

        conn.commit()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")

    return {
        "voice_note_id": voice_note_id,
        "transcript": transcript,
        "duration_seconds": int(duration),
        "language": language,
        "title": final_title,
        "tags": tags,
        "tokens_used": tokens_used,
        "transcription_cost": round(transcription_cost, 6),
        "embedding_cost": round(embedding_cost, 6),
        "total_cost": round(transcription_cost + embedding_cost, 6)
    }
