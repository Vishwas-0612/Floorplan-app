from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import io

from app.services import image_enhancer

router = APIRouter()


@router.post("/enhance")
async def enhance_image_file(file: UploadFile = File(...)):
    """Accept an image upload, call Gemini-backed enhancer, and return enhanced PNG."""
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="Uploaded file is not an image")

    body = await file.read()
    try:
        img = Image.open(io.BytesIO(body)).convert("RGBA")
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to open image")

    try:
        enhanced = image_enhancer.enhance_image(img)
    except RuntimeError as e:
        # e.g., missing SDK or missing env var
        raise HTTPException(status_code=503, detail=str(e))

    buf = io.BytesIO()
    enhanced.convert("RGBA").save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")
