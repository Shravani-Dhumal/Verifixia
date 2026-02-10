from datasets import load_dataset
import os
from PIL import Image

# Configuration
DATASET_NAME = "Hemg/deepfake-and-real-images"
OUTPUT_DIR = "Deepfake-Detection/DATA"
TARGET_COUNT = 50 # Per class

def main():
    print(f"Loading dataset {DATASET_NAME} (streaming)...")
    try:
        ds = load_dataset(DATASET_NAME, split="train", streaming=True)
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    counts = {"Fake": 0, "Real": 0}
    
    # Ensure directories exist
    os.makedirs(os.path.join(OUTPUT_DIR, "Fake"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "Real"), exist_ok=True)
    
    print("Iterating through dataset...")
    for i, sample in enumerate(ds):
        label = sample['label']
        if label == 0:
            label_str = "Fake"
        elif label == 1:
            label_str = "Real"
        else:
            continue
            
        if counts[label_str] >= TARGET_COUNT:
            if all(c >= TARGET_COUNT for c in counts.values()):
                break # Done
            continue # Skip if this class is full
            
        # Save image
        img = sample['image']
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        filename = f"{label_str}_{counts[label_str]}.jpg"
        save_path = os.path.join(OUTPUT_DIR, label_str, filename)
        
        try:
            img.save(save_path)
            counts[label_str] += 1
            if counts[label_str] % 10 == 0:
                print(f"Saved {counts[label_str]} {label_str} images")
        except Exception as e:
            print(f"Error saving {filename}: {e}")
            
        if i % 1000 == 0:
            print(f"Scanned {i} rows. Counts: {counts}")
            
    print(f"Download complete. Final counts: {counts}")

if __name__ == "__main__":
    main()
