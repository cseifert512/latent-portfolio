from fastapi import FastAPI
from .routers import images, embeddings, tags

app = FastAPI(title="Latent Portfolio API", version="1.0.0")

# Include routers
app.include_router(images.router)
app.include_router(embeddings.router)
app.include_router(tags.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Latent Portfolio API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"} 