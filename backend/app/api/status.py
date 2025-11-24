from fastapi import APIRouter
from app.queue.rq_setup import redis_conn
from rq.job import Job

router = APIRouter()

@router.get("/status/{job_id}")
def get_status(job_id: str):
    try:
        job = Job.fetch(job_id, connection=redis_conn)
    except Exception:
        return {"status": "unknown", "job_id": job_id}
    return {"status": job.get_status(), "result": job.result,"job_id": job_id}
