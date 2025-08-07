from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(prefix="/embeddings", tags=["Embeddings"])
DATA_DIR     = Path(__file__).parents[1] / "data"
EMBEDS_FN    = DATA_DIR / "embeddings.json"

@router.get("", summary="Get all embeddings")
async def get_embeddings():
    return json.loads(EMBEDS_FN.read_text()) 