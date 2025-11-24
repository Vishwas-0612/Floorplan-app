import os
import torch
from diffusers import StableDiffusionPipeline
from pathlib import Path

# Global cache so model loads only once
PIPELINE_CACHE = {
    "pipe": None,
    "sd_model_id": None,
    "lora_path": None
}

def load_pipeline(sd_model_id: str, lora_path: str, device: str = "cuda"):
    """
    Loads/caches Stable Diffusion + LoRA into memory once.
    Worker calls this repeatedly but the model loads only on first call.
    """
    global PIPELINE_CACHE

    # If pipeline already loaded, reuse it
    if (PIPELINE_CACHE["pipe"] is not None and
        PIPELINE_CACHE["sd_model_id"] == sd_model_id and
        PIPELINE_CACHE["lora_path"] == lora_path):
        return PIPELINE_CACHE["pipe"]

    print("🟦 Loading Stable Diffusion Model:", sd_model_id)
    print("🟦 Loading LoRA from:", lora_path)

    # Load base SD model
    print(f"🟦 Attempting to load model {sd_model_id}...")
    try:
        pipe = StableDiffusionPipeline.from_pretrained(
            sd_model_id,
            torch_dtype=torch.float16,
            safety_checker=None,
            feature_extractor=None,
            local_files_only=False # Allow download
        )
        print("✅ Model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        raise e

    # Load LoRA weights (optional)
    lora_path = Path(lora_path)
    if lora_path.exists():
        print("🟩 Applying LoRA weights...")
        pipe.load_lora_weights(str(lora_path))
    else:
        print("⚠️ WARNING: LoRA path does not exist:", lora_path)

    # Move to GPU
    pipe = pipe.to(device)

    # Enable optimizations
    try:
        pipe.enable_xformers_memory_efficient_attention()
        print("✅ xFormers enabled successfully.")
    except Exception as e:
        print(f"⚠️ Skipping xFormers due to compatibility issue: {e}")
    pipe.enable_model_cpu_offload()

    # Cache it
    PIPELINE_CACHE = {
        "pipe": pipe,
        "sd_model_id": sd_model_id,
        "lora_path": str(lora_path)
    }

    print("✅ Pipeline ready (cached for next jobs)")
    return pipe
