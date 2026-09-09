"""
Gemini Live voice relay (WebSocket) — the PRIMARY kiosk voice engine.

The browser streams 16 kHz mono PCM microphone audio to this endpoint. The
backend holds the Gemini Live session using the *server-side* API key — the key
never reaches the browser, not even as an ephemeral token — and streams the
input-transcription text back as JSON.

This is speech-to-text ONLY. The Live model's own generative output is
deliberately discarded: Gemini here transcribes, it never diagnoses, advises or
triages. Deterministic triage and the adaptive-question / clinical-summary REST
APIs remain the sole clinical authorities (see app/services/ai_service.py and
app/services/triage_service.py) — this relay does not touch the database, the
triage rules, or any of those endpoints.

Fallback contract: if Gemini is not configured, the SDK is unavailable, or the
Live session errors/times out at any point, the socket sends a `type:
"unsupported"` / `type: "error"` message (best effort) and closes cleanly. The
frontend then automatically falls back to the browser Web Speech engine
(see src/services/voiceService.ts) so the kiosk flow never breaks.

Protocol (JSON text frames from server, binary frames from client):
  client -> server : binary  = raw little-endian PCM16 mono @ 16 kHz
  client -> server : "end"   = the patient stopped talking (flush)
  server -> client : {"type": "ready"}
  server -> client : {"type": "transcript", "text": "...", "final": bool}
  server -> client : {"type": "unsupported" | "error", "detail": "..."}
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.services import ai_service

logger = logging.getLogger("clinsutra.voice")

router = APIRouter(tags=["voice"])

# Maps the kiosk Language codes (src/types/common.ts: "en" | "hi") to a name the
# Live system instruction can use. Unknown codes degrade to English.
_LANGUAGE_NAMES = {"en": "English", "hi": "Hindi"}


async def _send_json_safe(websocket: WebSocket, payload: dict) -> None:
    """Best-effort send; a closed/broken socket must never raise here."""
    try:
        await websocket.send_json(payload)
    except Exception:  # noqa: BLE001 - the client is gone; nothing to do
        pass


@router.websocket("/voice/live")
async def voice_live(websocket: WebSocket) -> None:
    await websocket.accept()

    language = websocket.query_params.get("language", "en")
    language_name = _LANGUAGE_NAMES.get(language, "English")
    settings = get_settings()

    # No key configured -> tell the client to fall back, then close normally.
    if not ai_service.is_configured(settings):
        await _send_json_safe(
            websocket, {"type": "unsupported", "detail": "Gemini Live is not configured."}
        )
        await websocket.close()
        return

    try:
        from google import genai
        from google.genai import types
    except Exception:  # noqa: BLE001 - SDK missing/broken -> fall back
        await _send_json_safe(
            websocket, {"type": "unsupported", "detail": "Gemini SDK is unavailable."}
        )
        await websocket.close()
        return

    client = genai.Client(api_key=settings.gemini_api_key)
    config = types.LiveConnectConfig(
        response_modalities=[types.Modality.TEXT],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        system_instruction=types.Content(
            parts=[
                types.Part(
                    text=(
                        "You are a silent speech-to-text service for a hospital "
                        f"intake kiosk. The patient is speaking {language_name}. "
                        "Only transcribe what the patient says. Never diagnose, "
                        "advise, ask questions, or answer — produce no spoken or "
                        "text reply of your own."
                    )
                )
            ]
        ),
    )

    try:
        async with client.aio.live.connect(
            model=settings.gemini_live_model, config=config
        ) as session:
            await _send_json_safe(websocket, {"type": "ready"})

            async def pump_audio() -> None:
                """Browser mic -> Gemini."""
                while True:
                    message = await websocket.receive()
                    if message.get("type") == "websocket.disconnect":
                        raise WebSocketDisconnect()
                    data = message.get("bytes")
                    if data:
                        await session.send_realtime_input(
                            audio=types.Blob(data=data, mime_type="audio/pcm;rate=16000")
                        )
                    elif message.get("text") == "end":
                        # Patient stopped talking; flush the current utterance.
                        await session.send_realtime_input(audio_stream_end=True)

            async def pump_transcript() -> None:
                """Gemini input-transcription -> browser.

                `input_transcription.text` arrives as (possibly incremental)
                deltas, which we accumulate and forward as interim text, then
                mark the phrase FINAL at the end-of-utterance signal — matching
                the frontend's interim/settled model (the frontend selects an
                option only on a final transcript).

                End-of-utterance signal: the dedicated transcription model
                `gemini-3.5-transcribe-live` signals completion with
                `generation_complete`, NOT `turn_complete` (verified by
                streaming real audio). We finalize on EITHER so this works
                across models. Without this, no final is ever emitted and the
                kiosk never selects an option from speech.

                The model's *generative* output (any model_turn parts) is
                ignored on purpose: this relay transcribes, it does not answer.
                """
                buffer = ""
                async for response in session.receive():
                    server_content = response.server_content
                    if not server_content:
                        continue

                    # A dedicated transcription model may deliver the recognised
                    # speech via input_transcription or output_transcription;
                    # accept whichever carries text. We never read model_turn —
                    # that would be the model's own generative reply, which this
                    # STT-only relay deliberately ignores.
                    transcription = (
                        server_content.input_transcription
                        or server_content.output_transcription
                    )
                    if transcription and transcription.text:
                        buffer += transcription.text
                        await _send_json_safe(
                            websocket,
                            {"type": "transcript", "text": buffer, "final": False},
                        )

                    if server_content.turn_complete or server_content.generation_complete:
                        if buffer:
                            await _send_json_safe(
                                websocket,
                                {"type": "transcript", "text": buffer, "final": True},
                            )
                        buffer = ""

            await asyncio.gather(pump_audio(), pump_transcript())

    except WebSocketDisconnect:
        # Normal client-initiated close (patient tapped stop / left the page).
        pass
    except Exception as exc:  # noqa: BLE001 - any Live/network error -> fall back
        logger.warning("Gemini Live session failed: %s", exc)
        await _send_json_safe(
            websocket, {"type": "error", "detail": "Gemini Live session ended unexpectedly."}
        )
    finally:
        try:
            await websocket.close()
        except Exception:  # noqa: BLE001 - already closed
            pass
