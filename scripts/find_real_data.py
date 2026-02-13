from datasets import load_dataset
import sys

def main():
    print("Streaming dataset...")
    ds = load_dataset("Hemg/deepfake-and-real-images", split="train", streaming=True)
    
    count_fake = 0
    count_real = 0
    
    for i, sample in enumerate(ds):
        label = sample['label']
        if label == 0:
            count_fake += 1
        elif label == 1:
            count_real += 1
            if count_real == 1:
                print(f"Found first REAL image at index {i}!")
        
        if i % 1000 == 0:
            print(f"Scanned {i} rows. Fake: {count_fake}, Real: {count_real}")
            
        if count_real >= 10:
            print("Found enough real images.")
            break
            
        if i > 20000:
             print("Scanned 20000 rows, still no Real images (or few). Stopping.")
             break

if __name__ == "__main__":
    main()
