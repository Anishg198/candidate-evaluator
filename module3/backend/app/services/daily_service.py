"""
Daily.co REST API integration.

Docs: https://docs.daily.co/reference
"""
import httpx
import uuid
from datetime import datetime, timezone, timedelta

from app.config import get_settings

settings = get_settings()

DAILY_HEADERS = {
    "Authorization": f"Bearer {settings.daily_api_key}",
    "Content-Type": "application/json",
}


async def create_room(session_id: str) -> dict:
    """
    Create a Daily.co room for the interview session.

    Returns room object with `name` and `url`.
    """
    room_name = f"hcl-interview-{session_id[:8]}"
    payload = {
        "name": room_name,
        "privacy": "private",
        "properties": {
            "enable_recording": "cloud",
            "enable_chat": True,
            "enable_knocking": True,
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp()),
            "max_participants": 2,
            "enable_network_ui": True,
        },
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.daily_api_base_url}/rooms",
            json=payload,
            headers=DAILY_HEADERS,
        )
        response.raise_for_status()
        return response.json()


async def create_meeting_token(
    room_name: str,
    participant_name: str,
    is_owner: bool,
    expires_in_seconds: int = 7200,
) -> str:
    """
    Create a scoped meeting token for a participant.

    Owners (interviewers) get extra controls (mute others, kick, recording).
    Candidates get non-owner tokens.
    """
    exp = int((datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)).timestamp())
    payload = {
        "properties": {
            "room_name": room_name,
            "user_name": participant_name,
            "is_owner": is_owner,
            "exp": exp,
            "enable_recording": "cloud" if is_owner else "off",
            "start_audio_off": False,
            "start_video_off": False,
        }
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.daily_api_base_url}/meeting-tokens",
            json=payload,
            headers=DAILY_HEADERS,
        )
        response.raise_for_status()
        data = response.json()
        return data["token"]


async def delete_room(room_name: str) -> None:
    """Delete a Daily.co room after session ends."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.delete(
            f"{settings.daily_api_base_url}/rooms/{room_name}",
            headers=DAILY_HEADERS,
        )
        # 404 is fine — room may have already expired
        if response.status_code not in (200, 404):
            response.raise_for_status()
