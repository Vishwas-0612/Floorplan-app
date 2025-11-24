import redis
from rq import Queue
import uuid
import time

redis_conn = redis.Redis(host='redis', port=6379)
q = Queue('inference', connection=redis_conn)

job_id = uuid.uuid4().hex
print(f"Submitting job {job_id}")

job = q.enqueue(
    'generate_task.generate_floorplan',
    job_id, # arg 1: job_id
    { # arg 2: params
        'prompt': 'a cozy living room',
        'steps': 1,
        'width': 512,
        'height': 512
    },
    job_id=job_id # kwarg for enqueue (sets the job ID)
)

print(f"Job submitted. Waiting for result...")
while not job.is_finished and not job.is_failed:
    time.sleep(1)
    job.refresh()

if job.is_finished:
    print(f"Job finished! Result: {job.result}")
else:
    print(f"Job failed! Error: {job.exc_info}")
