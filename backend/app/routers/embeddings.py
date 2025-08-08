from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(prefix="/embeddings", tags=["Embeddings"])
DATA_DIR     = Path(__file__).parents[1] / "data"
EMBEDS_FN    = DATA_DIR / "embeddings.json"
EMBEDS3D_FN  = DATA_DIR / "embeddings3d.json"

@router.get("", summary="Get all embeddings (2D)")
async def get_embeddings():
    return json.loads(EMBEDS_FN.read_text())

@router.get("/3d", summary="Get 3D embeddings")
async def get_embeddings_3d():
    if not EMBEDS3D_FN.exists():
        return []
    return json.loads(EMBEDS3D_FN.read_text()) 