from pathlib import Path
from PIL import Image
import torch, json
from transformers import CLIPProcessor, CLIPModel

# Constants
BASE_DIR = Path(__file__).parent
SAMPLE_DIR = BASE_DIR / "sample_images"
OUTPUT_FILE = BASE_DIR / "sample_tags.json"

# Example candidate tags – adjust later or load from a file
TAG_CANDIDATES = [
    "parametric", "site-analysis", "water-filtration",
    "spring-2024", "urbanism", "ecology", "digital",
    "diagram", "ai-generated", "render"
]
TOP_K = 5

# Load CLIP model
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

# Precompute text embeddings
with torch.no_grad():
    text_inputs = processor(text=TAG_CANDIDATES, return_tensors="pt", padding=True).to(device)
    text_features = model.get_text_features(**text_inputs)
    text_features = text_features / text_features.norm(dim=-1, keepdim=True)

# Loop over sample images
results = {}
for img_path in SAMPLE_DIR.glob("*"):
    if img_path.is_file() and img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
        try:
            img = Image.open(img_path).convert("RGB")
            inputs = processor(images=img, return_tensors="pt").to(device)
            with torch.no_grad():
                img_feat = model.get_image_features(**inputs)
                img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True)
                # cosine similarities
                sims = (img_feat @ text_features.T).squeeze(0)
                topk = sims.topk(TOP_K).indices.tolist()
                tags = [TAG_CANDIDATES[i] for i in topk]
            img_id = img_path.stem
            results[img_id] = tags
            print(f"Processed {img_id}: {tags}")
        except Exception as e:
            print(f"Error processing {img_path}: {e}")

# Write output JSON
with open(OUTPUT_FILE, "w") as f:
    json.dump(results, f, indent=2)
print(f"Wrote tag mappings for {len(results)} images to {OUTPUT_FILE}") 