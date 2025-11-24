from fastapi import APIRouter, Form, HTTPException
from uuid import uuid4
import os
from app.queue.rq_setup import q

router = APIRouter()

@router.post("/generate")
async def create_job(
    sqft: int = Form(...),
    garages: int = Form(...),
    bedrooms: int = Form(...),
    bathrooms: int = Form(...),
    prompt: str = Form(None), # Optional additional details
    negative_prompt: str = Form(None),
    height: int = Form(512),
    width: int = Form(512),
    steps: int = Form(50),
    seed: int = Form(None),
    guidance_scale: float = Form(7.5),
):
    # Construct the prompt from parameters
    # Format: "A floor plan of a house, {sqft} sqft, {bedrooms} bedrooms, {bathrooms} bathrooms, {garages} car garage, {prompt}"
    base_prompt = f"top down view, architectural drawing, floor plan of a house, {sqft} sqft, {bedrooms} bedrooms, {bathrooms} bathrooms, {garages} car garage, blueprint, technical drawing, white background"
    
    final_prompt = base_prompt
    if prompt and prompt.strip():
        final_prompt += f", {prompt.strip()}"

    # Default negative prompt to prevent common artifacts
    default_negative = "3d, perspective, isometric, photo, realistic, furniture, colorful, low quality, blurry, text, watermark, illustration, render"
    if not negative_prompt:
        negative_prompt = default_negative
    else:
        negative_prompt = f"{default_negative}, {negative_prompt}"

    job_id = uuid4().hex

    model_cfg = {
        "sd_model_id": os.environ.get("SD_MODEL_ID", "runwayml/stable-diffusion-v1-5"),
        "lora_path": os.environ.get("LORA_PATH", "/models/lora")
    }

    params = {
        "prompt": final_prompt,
        "negative_prompt": negative_prompt,
        "height": height,
        "width": width,
        "num_inference_steps": steps,
        "seed": seed,
        "guidance_scale": guidance_scale,
        "model_cfg": model_cfg
    }

    # Send to worker
    job = q.enqueue("generate_task.generate_floorplan", job_id, params)

    return {
        "job_id": job.get_id(),
        "message": "Generation started.",
        "constructed_prompt": final_prompt
    }
