from rq import Worker, Queue, SimpleWorker
from redis import Redis
from generate_task import generate_floorplan  # Import to ensure RQ can find it
import sys

# Setup simple logging to file
def log(msg):
    with open("/data/worker_log.txt", "a") as f:
        f.write(msg + "\n")
    print(msg)

log("Worker script starting...")

try:
    redis_conn = Redis(host="redis", port=6379)
    redis_conn.ping()
    log("Connected to Redis successfully.")
except Exception as e:
    log(f"Failed to connect to Redis: {e}")
    sys.exit(1)

queue = Queue("inference", connection=redis_conn)

if __name__ == "__main__":
    log("Starting RQ worker (SimpleWorker)...")
    # Use SimpleWorker to run in the main process (avoids fork/CUDA issues & enables caching)
    worker = SimpleWorker([queue], connection=redis_conn)
    worker.work()

