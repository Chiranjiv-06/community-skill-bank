"""
app/utils/observability.py

Module 20 — Observability, Request Correlation, and Metrics Utilities for Community Skill Bank.
Provides:
- Request ID context propagation (ContextVar)
- Sensitive credential & PII data sanitization
- In-process operational metrics collection
"""

import time
import uuid
import logging
import threading
from contextvars import ContextVar
from typing import Dict, Any, Optional

from app.services.realtime_service import realtime_manager

# Context variable for request correlation ID
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id_ctx", default=None)

SENSITIVE_KEYS = {
    "password",
    "hashed_password",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "secret",
    "secret_key",
    "api_key",
    "credentials",
    "cookie",
    "cookies",
}


def get_request_id() -> str:
    """Return the current context request ID or generate a new UUID."""
    req_id = request_id_ctx.get()
    return req_id if req_id else str(uuid.uuid4())


def set_request_id(req_id: str) -> None:
    """Set the request ID in the current async execution context."""
    request_id_ctx.set(req_id)


def sanitize_log_data(data: Any) -> Any:
    """
    Recursively sanitize dictionaries/lists to redact sensitive keys.
    """
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEYS:
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = sanitize_log_data(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_log_data(item) for item in data]
    return data


class MetricsCollector:
    """
    Thread-safe, in-process operational metrics collector.
    Note: In-process metrics are process-local and reset upon application restart.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self.requests_total: int = 0
        self.errors_total: int = 0
        self.status_distribution: Dict[str, int] = {}
        self.total_latency_ms: float = 0.0
        self.sync_conflicts: int = 0
        self.simulation_runs: int = 0
        self.audit_events_total: int = 0
        self.start_time: float = time.time()

    def record_request(self, status_code: int, duration_ms: float) -> None:
        """Record an incoming HTTP request completion."""
        status_bucket = f"{status_code // 100}xx"
        with self._lock:
            self.requests_total += 1
            self.total_latency_ms += duration_ms
            self.status_distribution[status_bucket] = self.status_distribution.get(status_bucket, 0) + 1
            if status_code >= 400:
                self.errors_total += 1

    def record_sync_conflict(self) -> None:
        """Increment count of detected offline sync conflicts."""
        with self._lock:
            self.sync_conflicts += 1

    def record_simulation_run(self) -> None:
        """Increment count of executed disaster simulations."""
        with self._lock:
            self.simulation_runs += 1

    def record_audit_event(self) -> None:
        """Increment count of recorded audit trail events."""
        with self._lock:
            self.audit_events_total += 1

    def get_metrics_snapshot(self) -> Dict[str, Any]:
        """Return an immutable snapshot dictionary of platform metrics."""
        with self._lock:
            req_count = self.requests_total
            avg_lat = round(self.total_latency_ms / req_count, 2) if req_count > 0 else 0.0
            uptime = round(time.time() - self.start_time, 1)

            # Safely fetch active websocket count from realtime manager
            active_ws = realtime_manager.get_active_socket_count()

            return {
                "requests_total": req_count,
                "errors_total": self.errors_total,
                "status_distribution": dict(self.status_distribution),
                "average_latency_ms": avg_lat,
                "sync_conflicts": self.sync_conflicts,
                "simulation_runs": self.simulation_runs,
                "active_websockets": active_ws,
                "audit_events_total": self.audit_events_total,
                "uptime_seconds": uptime,
            }


# Singleton metrics collector instance
metrics_collector = MetricsCollector()
logger = logging.getLogger("app.observability")
