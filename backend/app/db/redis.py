import redis
from app.core.config import settings

def get_redis_client():
    red = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,
        username=settings.REDIS_USERNAME,
        password=settings.REDIS_PASSWORD,
    )
    return red

redis_client = get_redis_client()
