import time
from dataclasses import dataclass
from enum import Enum

import redis.asyncio as aioredis


class RateLimitResult(Enum):
    ALLOWED = "allowed"
    DENIED = "denied"


@dataclass
class RateLimitInfo:
    result: RateLimitResult
    limit: int
    remaining: int
    reset_at: float
    retry_after: float



RATE_LIMIT_LUA_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end
local limit = tonumber(ARGV[1])
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
"""


class RateLimiter:

    def __init__(self, redis: aioredis.Redis):
        self._redis = redis
        self._script = None

    async def _get_script(self):
        if self._script is None:
            self._script = self._redis.register_script(RATE_LIMIT_LUA_SCRIPT)
        return self._script

    async def check(self, key: str, max_requests: int, window_seconds: int = 1) -> RateLimitInfo:

        now = time.time()
        window = int(now // window_seconds)
        redis_key = f"rl:{key}:{window}"

        script = await self._get_script()

        result = await script(
            keys=[redis_key],
            args=[max_requests, window_seconds],
        )

        current_count: int = result[0]
        ttl: int = result[1]  # seconds until this key expires

        reset_at = now + max(ttl, 0)
        retry_after = max(ttl, 0)

        if current_count > max_requests:
            return RateLimitInfo(
                result=RateLimitResult.DENIED,
                limit=max_requests,
                remaining=0,
                reset_at=reset_at,
                retry_after=retry_after,
            )

        return RateLimitInfo(
            result=RateLimitResult.ALLOWED,
            limit=max_requests,
            remaining=max_requests - current_count,
            reset_at=reset_at,
            retry_after=0.0,
        )
