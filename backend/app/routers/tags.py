from fastapi import APIRouter
from pathlib import Path
import json
from collections import Counter

router = APIRouter(prefix="/tags", tags=["Tags"])
DATA_DIR  = Path(__file__).parents[1] / "data"
TAGS_FN   = DATA_DIR / "tags.json"

@router.get("", summary="Get all tags with counts")
async def get_tags():
    # tags.json structure: { image_id: [tag, tag, ...], ... }
    image_to_tags = json.loads(TAGS_FN.read_text())
    tag_counter: Counter[str] = Counter()
    for tags in image_to_tags.values():
        tag_counter.update(tags)
    # Convert to list of {tag, count}, sorted by count desc
    return [
        {"tag": tag, "count": count}
        for tag, count in tag_counter.most_common()
    ] 