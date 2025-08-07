import json
from pathlib import Path

DATA_DIR = Path(__file__).parents[2] / "backend" / "app" / "data"
TAGS    = DATA_DIR / "tags.json"

tags_map = json.loads(TAGS.read_text())
metadata = []
for img_id, tags in tags_map.items():
    metadata.append({
        "id":    img_id,
        "title": img_id.replace("-", " ").title(),
        "url":   f"/thumbnails/{img_id}.jpg",
        "tags":  tags
    })
(DATA_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2)) 