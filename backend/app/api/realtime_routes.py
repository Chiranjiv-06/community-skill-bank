"""
app/api/realtime_routes.py

Module 17 — Real-Time WebSocket API Endpoints.
Provides authenticated full-duplex WebSocket communication for live notifications,
operational incident updates, assignment pipeline changes, and admin monitoring.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.services.realtime_service import realtime_manager
from app.schemas.schemas import RealtimeStatusOut
from app.utils.security import get_current_admin, get_user_from_jwt_token

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/ws",
    tags=["Real-Time"],
)


@router.websocket("")
@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="JWT Bearer access token"),
    db: Session = Depends(get_db),
):
    """
    Authenticated WebSocket endpoint for real-time notification and event streaming.

    Connection lifecycle:
    1. Authenticates client via `token` query parameter or `Sec-WebSocket-Protocol`.
    2. Enforces active account checks (rejects inactive users or invalid tokens with code 1008).
    3. Registers connection in `realtime_manager` under the authenticated user's ID.
    4. Streams targeted user events and administrative notifications.
    5. Responds to client keep-alive pings (`{"type": "ping"}` -> `{"type": "pong"}`).
    6. Gracefully unregisters and cleans up on disconnect.
    """
    # Fallback to subprotocol or header if query param not present
    if not token and "sec-websocket-protocol" in websocket.headers:
        token = websocket.headers.get("sec-websocket-protocol")

    try:
        user = get_user_from_jwt_token(token=token or "", db=db)
    except HTTPException as e:
        logger.warning(f"WebSocket authentication failed: {e.detail}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=e.detail)
        return
    except Exception as e:
        logger.warning(f"Unexpected error during WebSocket authentication: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        return

    # Connection accepted and registered
    await realtime_manager.connect(user_id=user.id, role=user.role, websocket=websocket)

    # Send handshake confirmation
    try:
        await websocket.send_json({
            "event": "connection.established",
            "user_id": user.id,
            "role": user.role,
            "message": "Connected to Community Skill Bank real-time stream",
        })
    except Exception as e:
        logger.warning(f"Failed to send initial handshake to user {user.id}: {e}")
        realtime_manager.disconnect(user_id=user.id, websocket=websocket)
        return

    # Keep-alive & message processing loop
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                data = {"type": data_text}

            # Handle keep-alive / heartbeat
            msg_type = data.get("type") if isinstance(data, dict) else data_text
            if msg_type in ("ping", "heartbeat"):
                await websocket.send_json({"type": "pong"})
            elif isinstance(data, dict) and data.get("action") == "ping":
                await websocket.send_json({"action": "pong"})
    except WebSocketDisconnect:
        realtime_manager.disconnect(user_id=user.id, websocket=websocket)
    except Exception as e:
        logger.info(f"WebSocket connection closed for user {user.id}: {e}")
        realtime_manager.disconnect(user_id=user.id, websocket=websocket)


@router.get(
    "/status",
    response_model=RealtimeStatusOut,
    summary="Get real-time connection status (Admin only)",
)
def get_realtime_status(
    _admin: User = Depends(get_current_admin),
):
    """
    Return active WebSocket connection counts and metrics for the real-time manager.
    """
    metrics = realtime_manager.get_status()
    return RealtimeStatusOut(
        connected_users_count=metrics["connected_users_count"],
        active_sockets_count=metrics["active_sockets_count"],
        connected_admins_count=metrics["connected_admins_count"],
    )
