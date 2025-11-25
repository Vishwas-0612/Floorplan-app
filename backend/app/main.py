from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api import generate, status, enhance

app = FastAPI(title="FloorPlan Generator API")

# ✅ Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(generate.router, prefix="/api")
app.include_router(status.router, prefix="/api")
app.include_router(enhance.router, prefix="/api")

# Serve generated images (PNG results)
app.mount("/generated", StaticFiles(directory="/data/generated"), name="generated")

@app.get("/")
def root():
    return {"status": "ok", "service": "floorplan-backend"}
