import os
import redis
from rq import Queue

redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
redis_conn = redis.from_url(redis_url)
q = Queue("inference", connection=redis_conn, default_timeout=3600)
