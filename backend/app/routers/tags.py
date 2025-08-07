from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter(prefix="/tags", tags=["Tags"])
DATA_DIR  = Path(__file__).parents[1] / "data"
TAGS_FN   = DATA_DIR / "tags.json"

@router.get("", summary="Get all tags with counts")
async def get_tags():
    raw = json.loads(TAGS_FN.read_text())
    return [{"tag": k, "count": len(v)} for k, v in raw.items()] 