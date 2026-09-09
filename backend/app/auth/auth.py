"""
app/auth/auth.py

LEGACY / DEPRECATED: This module is maintained solely for backward compatibility.
All canonical authentication and authorization functions reside in `app.utils.security`.
"""

import warnings
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
    require_role,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    pwd_context,
)

warnings.warn(
    "app.auth.auth is deprecated; use app.utils.security instead",
    DeprecationWarning,
    stacklevel=2,
)