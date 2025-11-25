import os
from pathlib import Path
import torch
from model_loader import load_pipeline

# postprocessing: erase gibberish text and overlay labels via Gemini
try:
    from postprocess import enhance_floorplan
except Exception:
    enhance_floorplan = None

# ------------------------------
# LOAD MODEL ONCE (GLOBAL)
# ------------------------------

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🔥 Loading Stable Diffusion on {device} (ONE-TIME LOAD)...")

GLOBAL_PIPE = load_pipeline(
    sd_model_id=os.environ.get("SD_MODEL_ID", "runwayml/stable-diffusion-v1-5"),
    lora_path=os.environ.get("LORA_PATH", "/models/lora"),
    device=device
)

print("✅ Model fully loaded and ready!")


# ------------------------------
# OUTPUT DIR
# ------------------------------
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "/data/generated"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def generate_floorplan(job_id: str, params: dict):
    """
    Runs inside RQ worker (forked).
    CUDA is already initialized outside, so it works.
    """
    try:
        pipe = GLOBAL_PIPE   # Use preloaded GPU pipeline

        prompt = params.get("prompt", "")
        neg_prompt = params.get("negative_prompt", None)
        height = int(params.get("height", 512))
        width = int(params.get("width", 512))
        steps = int(params.get("num_inference_steps", 50))
        guidance = float(params.get("guidance_scale", 7.5))
        seed = params.get("seed", None)

        print(f"🟦 Job {job_id}: {prompt}")

        # Seed
        generator = None
        if seed is not None:
            generator = torch.Generator(device=device).manual_seed(int(seed))

        # Run inference
        print("🟩 Running inference...")
        result = pipe(
            prompt=prompt,
            negative_prompt=neg_prompt,
            height=height,
            width=width,
            num_inference_steps=steps,
            guidance_scale=guidance,
            generator=generator
        )

        image = result.images[0]

        # Attempt post-processing to fix gibberish text using Gemini
        if enhance_floorplan is not None:
            try:
                print("🔧 Running post-processing (Gemini)...")
                image = enhance_floorplan(image)
            except Exception as e:
                print(f"[postprocess] failed: {e}")
        else:
            print("[postprocess] enhance_floorplan not available (missing import or SDK)")

        out_path = OUTPUT_DIR / f"{job_id}.png"
        image.save(out_path)

        print(f"✅ Saved result: {out_path}")

        return {
            "status": "success",
            "path": str(out_path),
            "job_id": job_id
        }

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {"status": "error", "error": str(e)}
