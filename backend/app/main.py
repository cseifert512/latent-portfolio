from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routers import images, embeddings, tags

app = FastAPI(title="Latent Portfolio API", version="1.0.0")

# Include routers
app.include_router(images.router)
app.include_router(embeddings.router)
app.include_router(tags.router)

# Serve thumbnails
THUMBS_DIR = Path(__file__).parents[1].parent / "images" / "thumbnails"
app.mount("/thumbnails", StaticFiles(directory=THUMBS_DIR), name="thumbnails")

@app.get("/")
async def root():
    return {"message": "Welcome to Latent Portfolio API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"} 