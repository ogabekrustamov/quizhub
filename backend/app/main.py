import time
import sentry_sdk
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram
from fastapi.responses import Response
from app.routers.auth import router as auth_router
from app.routers.questions import router as questions_router
from app.routers.collections import router as collections_router
from app.routers.rooms import router as rooms_router
from app.routers.game import router as game_router
from app.routers.leaderboard import router as leaderboard_router
from app.routers.game_history import router as game_history_router
from app.core.redis import close_redis, get_redis
from app.rate_limiter import RateLimitMiddleware
from app.config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.2,
        send_default_pii=False,
    )

REQUEST_COUNT = Counter(
    "quizhub_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "quizhub_request_latency_seconds",
    "HTTP request latency",
    ["method", "endpoint"]
)
ACTIVE_GAMES = Counter(
    "quizhub_games_total",
    "Total games started"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_redis()


app = FastAPI(title="QuizHub API", version="1.0.0", lifespan=lifespan)
app.add_middleware(RateLimitMiddleware, redis_getter=get_redis)

app.add_middleware(RateLimitMiddleware, redis_getter=get_redis)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def track_requests(request: Request, call_next):
    if request.url.path in ("/metrics", "/health"):
        return await call_next(request)

    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start

    endpoint = request.url.path
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=endpoint,
        status=response.status_code,
    ).inc()
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=endpoint,
    ).observe(duration)

    return response


app.include_router(auth_router)
app.include_router(questions_router)
app.include_router(collections_router)
app.include_router(rooms_router)
app.include_router(game_router)
app.include_router(leaderboard_router)
app.include_router(game_history_router)


@app.get("/metrics", include_in_schema=False)
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/test-sentry", include_in_schema=False)
async def test_sentry():
    raise Exception("Sentry test error!")


@app.get("/health")
async def health():
    return {"status": "ok"}
