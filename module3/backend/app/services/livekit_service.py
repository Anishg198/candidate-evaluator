"""
LiveKit REST API integration (self-hosted, no credit card required).

LiveKit server runs as a Docker service using --dev mode:
  API Key:    devkey
  API Secret: secret
  URL:        http://livekit:7880  (internal Docker network)
"""
import datetime
from livekit import api

from app.config import get_settings

settings = get_settings()


def _client() -> api.LiveKitAPI:
    return api.LiveKitAPI(
        url=settings.livekit_api_url,
        api_key=settings.livekit_api_key,
        api_secret=settings.livekit_api_secret,
    )


async def create_room(session_id: str) -> dict:
    """
    Create a LiveKit room for the interview session.

    Returns dict with `name` and `url` (the public WebSocket URL for clients).
    """
    room_name = f"hcl-interview-{session_id[:8]}"
    lkapi = _client()
    try:
        room = await lkapi.room.create_room(
            api.CreateRoomRequest(
                name=room_name,
                empty_timeout=120,   # delete room 2 min after last participant leaves
                max_participants=2,
            )
        )
    finally:
        await lkapi.aclose()

    return {
        "name": room.name,
        "url": settings.livekit_public_ws_url,
    }


async def create_meeting_token(
    room_name: str,
    participant_name: str,
    is_owner: bool,
    expires_in_seconds: int = 7200,
) -> str:
    """
    Generate a signed JWT for a participant to join the LiveKit room.

    Interviewers get room_admin=True; candidates get standard publish/subscribe.
    """
    token = (
        api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(participant_name)
        .with_name(participant_name)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                room_admin=is_owner,
            )
        )
        .with_ttl(datetime.timedelta(seconds=expires_in_seconds))
    )
    return token.to_jwt()


async def delete_room(room_name: str) -> None:
    """Delete a LiveKit room after the session ends."""
    lkapi = _client()
    try:
        await lkapi.room.delete_room(api.DeleteRoomRequest(room=room_name))
    except Exception:
        pass  # 404 / already gone is fine
    finally:
        await lkapi.aclose()
