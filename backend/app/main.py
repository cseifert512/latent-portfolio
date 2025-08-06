from fastapi import FastAPI

app = FastAPI(title="Latent Portfolio API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Welcome to Latent Portfolio API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"} 