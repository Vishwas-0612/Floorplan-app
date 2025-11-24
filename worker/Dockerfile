FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# your real requirements file name is worker-requirements.txt
COPY worker-requirements.txt /tmp/worker-requirements.txt

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /tmp/worker-requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cu118

COPY . .

# ensure data + model folders exist inside container
RUN mkdir -p /data/generated /models /tmp

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

CMD ["python", "worker.py"]
