from pathlib import Path
from PIL import Image
import torch, json
import umap
from transformers import CLIPProcessor, CLIPModel

# Constants
BASE_DIR      = Path(__file__).parent
SAMPLE_DIR    = BASE_DIR / "sample_images"
OUTPUT_FILE   = BASE_DIR / "sample_embeddings.json"
N_COMPONENTS  = 2

# Load CLIP vision model
model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
device    = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

# Compute image features
image_ids = []
features  = []

for img_path in SAMPLE_DIR.glob("*"):
    if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
        try:
            img = Image.open(img_path).convert("RGB")
            inputs = processor(images=img, return_tensors="pt").to(device)
            with torch.no_grad():
                feat = model.get_image_features(**inputs)
            feat = feat.squeeze(0).cpu().numpy()
            image_ids.append(img_path.stem)
            features.append(feat)
            print(f"Processed: {img_path.name}")
        except Exception as e:
            print(f"Error processing {img_path.name}: {e}")
    else:
        print(f"Skipping non-image file: {img_path.name}")

# Run UMAP
if features:
    reducer = umap.UMAP(n_components=N_COMPONENTS, random_state=42)
    embedding = reducer.fit_transform(features)  # shape: (n_samples, 2)
    
    # Write output JSON
    output = [
        {"id": img_id, "x": float(coord[0]), "y": float(coord[1])}
        for img_id, coord in zip(image_ids, embedding)
    ]
    
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2)
    print(f"Wrote embeddings for {len(output)} images to {OUTPUT_FILE}")
else:
    print("No images found to process. Creating empty output file.")
    with open(OUTPUT_FILE, "w") as f:
        json.dump([], f, indent=2) 