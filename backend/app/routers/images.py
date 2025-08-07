from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(prefix="/images", tags=["Images"])
DATA_DIR    = Path(__file__).parents[1] / "data"
METADATA_FN = DATA_DIR / "metadata.json"

@router.get("", summary="Get all image metadata")
async def get_images():
    return json.loads(METADATA_FN.read_text()) 