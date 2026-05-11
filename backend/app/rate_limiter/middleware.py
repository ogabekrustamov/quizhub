import json
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

import redis.asyncio as aioredis

from .rate_limiter import RateLimiter, RateLimitInfo, RateLimitResult
from app.core.security import decode_access_token


# CONFIGURATION
# POST requests
POST_RATE_LIMIT = 2          
POST_PER_SECONDS = 1      

# Other methods
RATE_LIMIT = 15       
PER_SECONDS = 1    


class RateLimitMiddleware(BaseHTTPMiddleware):

    def __init__(self, app, redis_getter=None, redis: aioredis.Redis | None = None):
        super().__init__(app)
        self._redis_getter = redis_getter
        self._limiter: RateLimiter | None = None
        if redis is not None:
            self._limiter = RateLimiter(redis)

    async def _get_limiter(self) -> RateLimiter:
        if self._limiter is None:
            if self._redis_getter is None:
                raise RuntimeError(
                    "RateLimitMiddleware: no redis connection or redis_getter provided"
                )
            redis = await self._redis_getter()
            self._limiter = RateLimiter(redis)
        return self._limiter

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:

        skip_paths = {"/health", "/docs", "/openapi.json", "/redoc"}
        if request.url.path in skip_paths:
            return await call_next(request)

        method = request.method.upper()

        if method == "POST":
            max_requests = POST_RATE_LIMIT
            window_seconds = POST_PER_SECONDS
            identity = self._extract_user_id(request)
            # Key format: "post:user:<user_id>" | "post:ip:<ip>"
            if identity:
                key = f"post:user:{identity}"
            else:
                key = f"post:ip:{self._get_client_ip(request)}"
        else:
            # GET, PUT, DELETE, PATCH
            max_requests = RATE_LIMIT
            window_seconds = PER_SECONDS
            ip = self._get_client_ip(request)
            key = f"{method.lower()}:ip:{ip}"

        limiter = await self._get_limiter()
        info: RateLimitInfo = await limiter.check(
            key=key,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )

        if info.result == RateLimitResult.DENIED:
            return self._build_429_response(info)

        response: Response = await call_next(request)
        self._attach_headers(response, info)

        return response

    def _extract_user_id(self, request: Request) -> str | None:
        auth_header = request.headers.get("authorization", "")

        if auth_header.startswith("Bearer "):
            token = auth_header[7:]  # strip "Bearer "
            if not token:
                return None

            payload = decode_access_token(token)
            if payload and "sub" in payload:
                return str(payload["sub"])

        return None
    def _get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

        if request.client:
            return request.client.host

        return "unknown"

    def _build_429_response(self, info: RateLimitInfo) -> JSONResponse:
        """
        {
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please wait 1 seconds.",
            "retry_after": 1
        }
        """
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limit_exceeded",
                "message": f"Too many requests. Please wait {info.retry_after:.0f} seconds.",
                "retry_after": info.retry_after,
            },
            headers={
                "Retry-After": str(int(info.retry_after)),
                "X-RateLimit-Limit": str(info.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(info.reset_at)),
            },
        )

    def _attach_headers(self, response: Response, info: RateLimitInfo) -> None:
        response.headers["X-RateLimit-Limit"] = str(info.limit)
        response.headers["X-RateLimit-Remaining"] = str(info.remaining)
        response.headers["X-RateLimit-Reset"] = str(int(info.reset_at))
