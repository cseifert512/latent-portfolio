from pathlib import Path
from PIL import Image
import json
import torch
import numpy as np
from sklearn.decomposition import PCA
from transformers import CLIPProcessor, CLIPModel

BASE_DIR = Path(__file__).parent
SAMPLE_DIR = BASE_DIR / "sample_images"
OUTPUT_FILE = BASE_DIR.parents[2] / "backend" / "app" / "data" / "embeddings3d.json"

# Load CLIP
device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model.eval()

image_ids = []
features = []

valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}

for img_path in sorted(SAMPLE_DIR.glob("*")):
    if not img_path.is_file() or img_path.suffix.lower() not in valid_exts:
        continue
    try:
        img = Image.open(img_path).convert("RGB")
        inputs = processor(images=img, return_tensors="pt").to(device)
        with torch.no_grad():
            feat = model.get_image_features(**inputs)
        feat = feat.squeeze(0)
        # Normalize
        feat = feat / feat.norm(dim=-1, keepdim=True)
        features.append(feat.cpu().numpy())
        image_ids.append(img_path.stem)
        print(f"Encoded: {img_path.name}")
    except Exception as e:
        print(f"Error processing {img_path.name}: {e}")

if not features:
    print("No images found; writing empty embeddings file")
    OUTPUT_FILE.write_text("[]")
    raise SystemExit(0)

X = np.vstack(features)

# PCA to 3D
pca = PCA(n_components=3, random_state=42)
coords3d = pca.fit_transform(X)

records = []
for idx, img_id in enumerate(image_ids):
    x, y, z = coords3d[idx].tolist()
    records.append({"id": img_id, "x": float(x), "y": float(y), "z": float(z)})

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.write_text(json.dumps(records, indent=2))
print(f"Wrote 3D embeddings for {len(records)} images to {OUTPUT_FILE}")