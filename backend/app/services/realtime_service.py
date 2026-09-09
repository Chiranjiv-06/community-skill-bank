"""
app/services/realtime_service.py

Module 17 — Real-Time WebSocket Connection Manager for Community Skill Bank.
Provides in-process, memory-safe, asynchronous WebSocket management for:
- User-targeted notification delivery
- Multi-device/multi-tab connection support per user
- Admin operational alerts & broadcast channels
- Resilient dead socket cleanup
- Sync-to-async dispatch bridge for background/REST operations
"""

import asyncio
import logging
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Thread-safe / Async-safe WebSocket connection registry for active clients.
    """

    def __init__(self):
        # Maps user_id -> Set of active WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Set of active WebSocket connections for users with role == 'admin'
        self.admin_connections: Set[WebSocket] = set()

    async def connect(self, user_id: int, role: str, websocket: WebSocket) -> None:
        """
        Accept and register an authenticated WebSocket connection.
        """
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

        if role == "admin":
            self.admin_connections.add(websocket)

        logger.info(f"WebSocket connected: user_id={user_id}, role={role}, active_sockets={self.get_active_socket_count()}")

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        """
        Unregister a WebSocket connection upon disconnect or error.
        """
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        self.admin_connections.discard(websocket)
        logger.info(f"WebSocket disconnected: user_id={user_id}, active_sockets={self.get_active_socket_count()}")

    async def send_to_user(self, user_id: int, event: Dict[str, Any]) -> None:
        """
        Send a JSON event to all active sockets belonging to a specific user.
        Safely prunes any stale/dead connections.
        """
        if user_id not in self.active_connections:
            return

        dead_sockets = []
        sockets = list(self.active_connections[user_id])

        for ws in sockets:
            try:
                await ws.send_json(event)
            except Exception as e:
                logger.warning(f"Failed to send event to user {user_id} on socket: {e}")
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(user_id, ws)

    async def send_to_users(self, user_ids: List[int], event: Dict[str, Any]) -> None:
        """
        Send a JSON event to multiple specific users.
        """
        unique_ids = set(user_ids)
        tasks = [self.send_to_user(uid, event) for uid in unique_ids if uid in self.active_connections]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_admins(self, event: Dict[str, Any]) -> None:
        """
        Send a JSON event to all connected admin sockets.
        """
        dead_admin_sockets = []
        sockets = list(self.admin_connections)

        for ws in sockets:
            try:
                await ws.send_json(event)
            except Exception as e:
                logger.warning(f"Failed to send event to admin on socket: {e}")
                dead_admin_sockets.append(ws)

        for ws in dead_admin_sockets:
            self.admin_connections.discard(ws)

    async def broadcast_to_all(self, event: Dict[str, Any]) -> None:
        """
        Broadcast a JSON event to every connected client.
        """
        all_user_ids = list(self.active_connections.keys())
        await self.send_to_users(all_user_ids, event)

    def dispatch_event_sync(
        self,
        user_ids: Optional[List[int]] = None,
        event: Optional[Dict[str, Any]] = None,
        send_to_admins_flag: bool = False,
    ) -> None:
        """
        Synchronous non-blocking bridge to dispatch real-time events from
        synchronous SQLAlchemy service workflows.
        """
        if not event:
            return

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            if user_ids:
                loop.create_task(self.send_to_users(user_ids, event))
            if send_to_admins_flag:
                loop.create_task(self.send_to_admins(event))
        else:
            # When no event loop is running (e.g. standalone sync CLI scripts),
            # real-time dispatch is safely bypassed while DB persistence is preserved.
            pass

    def get_connected_user_count(self) -> int:
        """Return the number of distinct authenticated users currently connected."""
        return len(self.active_connections)

    def get_active_socket_count(self) -> int:
        """Return the total number of active open WebSocket connections."""
        return sum(len(sockets) for sockets in self.active_connections.values())

    def get_connected_admin_count(self) -> int:
        """Return the total number of active admin WebSocket connections."""
        return len(self.admin_connections)

    def get_status(self) -> Dict[str, int]:
        """Return a snapshot of current real-time manager metrics."""
        return {
            "connected_users_count": self.get_connected_user_count(),
            "active_sockets_count": self.get_active_socket_count(),
            "connected_admins_count": self.get_connected_admin_count(),
        }


# Global singleton manager instance
realtime_manager = ConnectionManager()
