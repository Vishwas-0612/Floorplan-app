from uuid import uuid4

def test_prompt_construction(sqft, garages, bedrooms, bathrooms, prompt=None, negative_prompt=None):
    # Logic copied from generate.py
    base_prompt = f"top down view, architectural drawing, floor plan of a house, {sqft} sqft, {bedrooms} bedrooms, {bathrooms} bathrooms, {garages} car garage, blueprint, technical drawing, white background"
    
    final_prompt = base_prompt
    if prompt and prompt.strip():
        final_prompt += f", {prompt.strip()}"

    default_negative = "3d, perspective, isometric, photo, realistic, furniture, colorful, low quality, blurry, text, watermark, illustration, render"
    if not negative_prompt:
        negative_prompt = default_negative
    else:
        negative_prompt = f"{default_negative}, {negative_prompt}"

    print(f"Input Prompt: {prompt}")
    print(f"Final Prompt: {final_prompt}")
    print(f"Negative Prompt: {negative_prompt}")
    print("-" * 20)

test_prompt_construction(2000, 2, 3, 2, "open concept")
test_prompt_construction(1500, 1, 2, 1, "")
test_prompt_construction(3000, 3, 4, 3, "modern", "extra negative")
