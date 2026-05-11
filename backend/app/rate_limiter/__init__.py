"""
rate_limiter — Fixed Window Rate Limiter for FastAPI + Redis
============================================================

Quick start:
    from rate_limiter import RateLimitMiddleware

    @app.on_event("startup")
    async def startup():
        redis = await get_redis()
        app.add_middleware(RateLimitMiddleware, redis=redis)
"""

from .rate_limiter import RateLimiter, RateLimitInfo, RateLimitResult
from .middleware import RateLimitMiddleware

__all__ = [
    "RateLimiter",
    "RateLimitInfo",
    "RateLimitResult",
    "RateLimitMiddleware",
]
