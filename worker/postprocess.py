import os
import io
import json
import base64
from typing import List, Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

try:
    # google-genai v1.0 SDK (package name: google-genai)
    from google_genai import Client as GenAIClient  # type: ignore[import]
except Exception:
    GenAIClient = None


def encode_image_to_base64(image: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _extract_json(text: Optional[str]):
    if not text or not isinstance(text, str):
        return None

    start = None
    for ch in ("[", "{"):
        idx = text.find(ch)
        if idx != -1:
            start = idx
            break
    if start is None:
        return None

    if text[start] == "[":
        end = text.rfind("]")
    else:
        end = text.rfind("}")

    snippet = text if end == -1 else text[start : end + 1]

    try:
        return json.loads(snippet)
    except Exception:
        return None


def _normalize_box(item: Dict[str, Any], img_w: int, img_h: int):
    if all(k in item for k in ("x1", "y1", "x2", "y2")):
        x1, y1, x2, y2 = item["x1"], item["y1"], item["x2"], item["y2"]
    elif all(k in item for k in ("x", "y", "width", "height")):
        x1 = item["x"]
        y1 = item["y"]
        x2 = x1 + item["width"]
        y2 = y1 + item["height"]
    else:
        return None

    def to_px(val, maxv):
        try:
            v = float(val)
        except Exception:
            return None
        if 0.0 <= v <= 1.0:
            return int(round(v * maxv))
        return int(round(v))

    x1_px = to_px(x1, img_w)
    y1_px = to_px(y1, img_h)
    x2_px = to_px(x2, img_w)
    y2_px = to_px(y2, img_h)

    if None in (x1_px, y1_px, x2_px, y2_px):
        return None

    x1_px = max(0, min(img_w - 1, x1_px))
    y1_px = max(0, min(img_h - 1, y1_px))
    x2_px = max(0, min(img_w, x2_px))
    y2_px = max(0, min(img_h, y2_px))

    return (x1_px, y1_px, x2_px, y2_px)


def call_gemini_extract_rooms_from_base64(
    b64: str, model: str = "gemini-1.5-flash"
) -> List[Dict[str, Any]]:
    if GenAIClient is None:
        raise RuntimeError("google-genai SDK is not installed or failed to import")

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable is not set")

    client = GenAIClient(api_key=api_key)

    prompt_text = (
        "Analyze the provided architectural floor plan image. Identify rooms such as Kitchen, Bedroom, Bathroom, Living Room, Dining Room, Garage, Hallway, etc. "
        "For each room return a JSON array. Each item must include a 'name' string and a bounding box in pixel coordinates. "
        "Acceptable bounding box formats: either {\"x\":...,\"y\":...,\"width\":...,\"height\":...} or {\"x1\":...,\"y1\":...,\"x2\":...,\"y2\":...}. "
        "Return ONLY valid JSON (an array or object) with no additional text or commentary."
    )

    try:
        resp = client.responses.create(
            model=model,
            input=[{"mime_type": "image/png", "image_bytes": b64}, {"text": prompt_text}],
            max_output_tokens=1024,
        )
    except Exception as e:
        raise RuntimeError(f"Gemini request failed: {e}")

    text_out = None
    if hasattr(resp, "output_text"):
        text_out = resp.output_text
    elif isinstance(resp, dict):
        text_out = resp.get("output_text") or resp.get("text") or json.dumps(resp)
    else:
        try:
            text_out = str(resp)
        except Exception:
            text_out = None

    parsed = _extract_json(text_out)
    if not parsed:
        return []

    if isinstance(parsed, dict):
        for k in ("rooms", "items", "annotations"):
            if k in parsed and isinstance(parsed[k], list):
                parsed = parsed[k]
                break

    if not isinstance(parsed, list):
        return []

    return parsed


def draw_labels_on_image(image: Image.Image, rooms: List[Dict[str, Any]]) -> Image.Image:
    img_w, img_h = image.size
    draw = ImageDraw.Draw(image)
    erase_fill = (245, 245, 220)

    try:
        default_font = ImageFont.truetype("arial.ttf", size=14)
    except Exception:
        default_font = ImageFont.load_default()

    for item in rooms:
        name = item.get("name") or item.get("label") or item.get("room")
        box = _normalize_box(item, img_w, img_h)
        if not name or not box:
            continue

        x1, y1, x2, y2 = box
        pad_x = max(4, int((x2 - x1) * 0.05))
        pad_y = max(4, int((y2 - y1) * 0.05))
        rx1 = max(0, x1 - pad_x)
        ry1 = max(0, y1 - pad_y)
        rx2 = min(img_w, x2 + pad_x)
        ry2 = min(img_h, y2 + pad_y)

        draw.rectangle([rx1, ry1, rx2, ry2], fill=erase_fill)

        try:
            target_size = max(10, int((ry2 - ry1) * 0.22))
            try:
                f = ImageFont.truetype("arial.ttf", size=target_size)
            except Exception:
                f = default_font
        except Exception:
            f = default_font

        text_x = rx1 + 6
        text_y = ry1 + 4
        draw.text((text_x, text_y), name, fill="black", font=f)

    return image


def enhance_image(image: Image.Image, model: str = "gemini-1.5-flash") -> Image.Image:
    b64 = encode_image_to_base64(image)
    try:
        rooms = call_gemini_extract_rooms_from_base64(b64, model=model)
    except Exception as e:
        print(f"[image_enhancer] Gemini failed: {e}")
        return image

    if not rooms:
        return image

    return draw_labels_on_image(image, rooms)


# Backwards-compatible wrapper expected by generate_task
def enhance_floorplan(image: Image.Image, model: str = "gemini-1.5-flash") -> Image.Image:
    return enhance_image(image, model=model)
