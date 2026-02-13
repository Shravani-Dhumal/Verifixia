# Deepfake Detection System

A comprehensive deepfake detection system with separated frontend and backend architecture. Train models once and use them across all devices without retraining.

## 🎯 Features

- **PyTorch-based Training**: Train custom deepfake detection models
- **Web Interface**: Modern, responsive web UI for image upload and analysis
- **Real-time Detection**: Live webcam-based deepfake detection
- **Model Sharing**: Train once, use everywhere - no retraining needed
- **RESTful API**: Clean backend API for integration

## 📁 Project Structure

```
Deepfake_Detection_System/
├── backend/              # Backend API and training
│   ├── app.py           # Flask API server
│   ├── pytorch/         # Training scripts and models
│   │   ├── train_improved.py
│   │   ├── config.yaml
│   │   └── models/
│   ├── tensorflow/      # TensorFlow inference (optional)
│   ├── utils/           # Utility scripts
│   └── uploads/         # Temporary uploads
│
├── frontend/            # Frontend UI
│   └── index.html       # Complete web interface
│
├── models/              # Trained model weights (shared)
│   └── xception_deepfake.pth
│
├── data/                # Dataset (if using local data)
├── evaluation/          # Model evaluation scripts
├── docs/                # Documentation
└── Test/                # Test videos
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train a Model (One Time Only)

**Option A: Using Hugging Face Dataset (Recommended)**
```bash
cd backend/pytorch
python train_improved.py
```

**Option B: Using Local Dataset**
1. Prepare your dataset in `data/processed/train/` and `data/processed/val/`
2. Update `backend/pytorch/config.yaml` to set `use_huggingface_dataset: false`
3. Run training:
```bash
cd backend/pytorch
python train_improved.py
```

The model will be saved to `models/xception_deepfake.pth`

### 3. Share Model to Other Devices (Optional)

Copy the trained model to other devices:
```bash
cp models/xception_deepfake.pth /path/to/other/device/models/
```

### 4. Run the Application

```bash
cd backend
python app.py
```

Open `http://localhost:3000` in your browser.

## 📖 Documentation

- **Quick Start**: See `QUICK_START.md`
- **Project Structure**: See `PROJECT_STRUCTURE.md`
- **Backend Details**: See `backend/README.md`
- **Frontend Details**: See `frontend/README.md`
- **Models**: See `models/README.md`

## 🎯 Key Benefits

✅ **Train Once, Use Everywhere**: Train on one device, copy model to others  
✅ **No Retraining**: Use the same model on all devices  
✅ **Clear Structure**: Frontend and backend separated  
✅ **Easy Sharing**: Models in dedicated directory  
✅ **Clean Codebase**: Well-organized, no duplicate files  

## 🔧 Requirements

- Python 3.11 or 3.12
- PyTorch 2.1.2+
- Flask 3.0.0+
- OpenCV 4.8+
- See `requirements.txt` for complete list

## 🐛 Troubleshooting

### Model Not Found
- Train a model first: `cd backend/pytorch && python train_improved.py`
- Check that `models/xception_deepfake.pth` exists

### Training Issues
- Check dataset paths in `backend/pytorch/config.yaml`
- Verify dataset structure (real/fake folders)
- Check training logs

### Port Already in Use
- Change port in `backend/app.py`: `app.run(port=3001)`

## 📝 License

See LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Note**: This project is for research and educational purposes. Always verify important decisions with multiple sources and methods.

## Docs README

# Documentation

This directory contains project documentation, presentations, and archived files.

## Structure

```
docs/
├── README.md                    # This file
├── architecture_diagram.png     # System architecture diagram
├── presentation.pptx            # Project presentation
├── proposal.pdf                 # Project proposal
└── archive/                     # Archived documentation
    ├── ANALYSIS_SUMMARY.md
    ├── API_INTEGRATION_GUIDE.md
    ├── CODE_REVIEW_REPORT.md
    ├── FIX_SUMMARY.md
    ├── FIXES_IMPLEMENTED.md
    ├── IMPROVEMENTS.md
    ├── MEDIAPIPE_INTEGRATION.md
    ├── PROJECT_COMPLETE.md
    ├── PROJECT_SUMMARY.md
    ├── RUN_SUMMARY.md
    ├── SETUP.md
    ├── SUPPORTING_FILES.md
    ├── UI_GUIDE.md
    └── WEB_APP_GUIDE.md
```

## Main Documentation

For current documentation, see:
- **README.md** (root) - Main project documentation
- **QUICK_START.md** (root) - Quick start guide
- **PROJECT_STRUCTURE.md** (root) - Project structure details
- **backend/README.md** - Backend documentation
- **frontend/README.md** - Frontend documentation
- **models/README.md** - Models documentation

## Archive

The `archive/` folder contains older documentation files that are kept for reference but may not reflect the current project structure.

## Models README

# Models Directory

This directory stores trained model weights that can be shared across different devices.

## Purpose

- **Avoid Retraining**: Once trained, copy the model file to other devices
- **Consistency**: Use the same trained model across all devices
- **Version Control**: Keep different model versions for comparison

## Model File

After training, the model will be saved as:
```
models/xception_deepfake.pth
```

## Sharing Models Across Devices

### Method 1: Direct Copy
```bash
# On training device
cp models/xception_deepfake.pth /path/to/shared/location

# On other device
cp /path/to/shared/location/xception_deepfake.pth models/
```

### Method 2: Git (for small models)
```bash
# Add model to git (if repository is set up)
git add models/xception_deepfake.pth
git commit -m "Add trained model"
git push

# On other device
git pull
```

### Method 3: Cloud Storage
Upload to Google Drive, Dropbox, etc., and download on other devices.

## Model Information

- **Architecture**: MobileNetV2 (Xception-based)
- **Input Size**: 224x224 RGB images
- **Output**: Binary classification (Real/Fake)
- **Format**: PyTorch state dict (.pth)

## Usage

The backend automatically looks for models in this directory. No configuration needed - just place the model file here and restart the backend server.

## Important Notes

- **File Size**: Model files can be large (50-200MB typically)
- **Compatibility**: Models trained on one device work on all devices (CPU/GPU)
- **Version**: Ensure PyTorch versions are compatible across devices

## Backend README

# Backend - Deepfake Detection API

This directory contains the backend server and training scripts for the Deepfake Detection System.

## Structure

```
backend/
├── app.py                 # Flask API server
├── pytorch/               # Training scripts and model definitions
│   ├── train_improved.py # Main training script
│   ├── dataset_improved.py
│   ├── config.yaml       # Training configuration
│   └── models/           # Model architecture definitions
├── tensorflow/           # TensorFlow inference (if needed)
└── uploads/              # Temporary upload directory
```

## Running the Backend Server

```bash
# From project root
cd backend
python app.py
```

The server will start on `http://localhost:3000`

## Training a Model

### Option 1: Using Hugging Face Dataset (Recommended)

1. Edit `pytorch/config.yaml`:
   ```yaml
   data:
     use_huggingface_dataset: true
     huggingface_dataset: "prithivMLmods/OpenDeepfake-Preview"
   ```

2. Run training:
   ```bash
   cd backend/pytorch
   python train_improved.py
   ```

### Option 2: Using Local Dataset

1. Prepare your dataset:
   ```
   data/processed/
   ├── train/
   │   ├── real/
   │   └── fake/
   └── val/
       ├── real/
       └── fake/
   ```

2. Edit `pytorch/config.yaml`:
   ```yaml
   data:
     use_huggingface_dataset: false
     train_dir: ../../data/processed/train
     val_dir: ../../data/processed/val
   ```

3. Run training:
   ```bash
   cd backend/pytorch
   python train_improved.py
   ```

## Model Storage

Trained models are saved to the `models/` directory at the project root. This allows you to:

- **Share models across devices**: Copy the model file to other machines
- **Avoid retraining**: Use the same trained model on different devices
- **Version control**: Keep different model versions

The model will be saved as `models/xception_deepfake.pth` after training completes.

## API Endpoints

- `GET /` - Serve frontend
- `POST /api/upload` - Upload and analyze an image
- `POST /api/webcam/start` - Start webcam capture
- `GET /api/webcam/frame` - Get latest webcam frame with detections
- `POST /api/webcam/stop` - Stop webcam capture
- `GET /api/history` - Get analysis history
- `GET /api/stats` - Get statistics

## Troubleshooting

### Model Not Found Error

If you see "Model not available" errors:
1. Train a model first using `train_improved.py`
2. Ensure the model is saved to `models/xception_deepfake.pth`
3. Check that the model file exists and is readable

### Training Issues

If training shows wrong information:
1. Check your dataset - ensure images are properly labeled (real/fake)
2. Verify dataset paths in `config.yaml`
3. Increase training epochs if accuracy is low
4. Check training logs for errors

### Path Issues

All paths in the backend are relative to the backend directory. The training script automatically resolves paths from the config file location.

## Frontend README

# Frontend - Deepfake Detection UI

This directory contains the frontend user interface for the Deepfake Detection System.

## Structure

```
frontend/
└── index.html    # Main HTML file with embedded CSS and JavaScript
```

## Features

- **Image Upload**: Upload images for deepfake detection
- **Webcam Detection**: Real-time webcam-based detection
- **Results Display**: Visual display of detection results with confidence scores
- **Statistics**: Session statistics and analysis history

## Usage

The frontend is served by the Flask backend server. Simply start the backend:

```bash
cd backend
python app.py
```

Then open `http://localhost:3000` in your browser.

## Customization

Edit `index.html` to customize:
- Styling (CSS in `<style>` tag)
- UI layout and components
- JavaScript functionality
- API endpoints (if backend changes)

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

Note: Webcam functionality requires browser permissions for camera access.

## Backend Utils README

# Utility Scripts

This directory contains utility scripts for data processing and project management.

## Scripts

- `extract_frames.py` - Extract frames from video files for training data
- `split_dataset.py` - Split dataset into train/validation sets

## Usage

These are helper scripts for data preparation. The main application uses the backend API and training scripts in the parent directories.

## Test README

# Test Videos

This directory contains test video samples for deepfake detection.

## Structure

```
test/
├── Real/          # Real video samples (not deepfakes)
└── deepfake/      # Deepfake video samples
```

## Usage

These videos can be used for:
- Testing the detection system
- Evaluation and benchmarking
- Demonstration purposes

## Notes

- Videos are in `.mp4` format
- Use utility scripts in `backend/utils/` to extract frames from videos
- These are test samples, not training data

## Data README

# Data Directory

This directory contains training and test datasets for the deepfake detection system.

## Structure

```
data/
├── raw/                    # Raw dataset (original images/videos)
│   ├── real/              # Real face images/videos
│   └── fake/              # Deepfake images/videos
│
└── processed/              # Processed dataset for training
    ├── train/             # Training data
    │   ├── real/          # Real training images
    │   └── fake/          # Fake training images
    │
    └── val/               # Validation data
        ├── real/          # Real validation images
        └── fake/          # Fake validation images
```

## Usage

### For Local Training

1. Place your raw data in `data/raw/real/` and `data/raw/fake/`
2. Process and split data using utility scripts:
   ```bash
   cd backend/utils
   python extract_frames.py  # Extract frames from videos
   python split_dataset.py   # Split into train/val
   ```
3. Processed data will be in `data/processed/train/` and `data/processed/val/`
4. Update `backend/pytorch/config.yaml` to use local data:
   ```yaml
   data:
     use_huggingface_dataset: false
     train_dir: ../../data/processed/train
     val_dir: ../../data/processed/val
   ```

### For Hugging Face Dataset

The system can also use Hugging Face datasets. See `backend/pytorch/config.yaml` for configuration.

## Notes

- Images should be in formats: `.jpg`, `.jpeg`, `.png`, `.bmp`
- Videos should be in `.mp4` format
- Ensure proper labeling: real images in `real/`, fake images in `fake/`

## Backend Evaluation README

# Model Evaluation

This directory contains scripts for evaluating trained deepfake detection models.

## Scripts
- **generate_predictions.py** - Generate predictions from a trained model
  - Loads a trained PyTorch model
  - Runs inference on labeled data
  - Saves `y_true.npy`, `y_pred.npy`, and `y_proba.npy`
- **metrics.py** - Evaluate saved predictions
  - Confusion matrix + classification report
  - Optional ROC / Precision-Recall curves + JSON export

## Usage

### Generate Predictions
```bash
cd backend/evaluation
python generate_predictions.py \
    --model ../../models/xception_deepfake.pth \
    --data ../../data/processed/val \
    --output .
```
This will create `y_true.npy`, `y_pred.npy`, and `y_proba.npy`.

### Evaluate Model
```bash
cd backend/evaluation
python metrics.py y_true.npy y_pred.npy y_proba.npy
```
This prints metrics and (by default) writes files like `confusion_matrix.png`, `roc_curve.png`, `pr_curve.png`, and `metrics.json`.

## Requirements

- Trained model in `models/xception_deepfake.pth`
- Test data with ground truth labels
- NumPy and scikit-learn installed

## Models ONNX README

# ONNX Models

This directory contains exported ONNX model files for cross-platform deployment.

## Purpose

ONNX (Open Neural Network Exchange) models allow you to:
- Deploy models on different platforms (CPU, GPU, mobile)
- Use different inference engines (ONNX Runtime, TensorRT, etc.)
- Optimize models for production

## Exporting Models

To export a PyTorch model to ONNX format:

```bash
cd backend/pytorch
python export_to_onnx.py
```

The exported model will be saved to `models/onnx/xception_deepfake.onnx`

## Usage

ONNX models can be used with ONNX Runtime:

```python
import onnxruntime as ort

# Load model
session = ort.InferenceSession("models/onnx/xception_deepfake.onnx")

# Run inference
outputs = session.run(None, {"input": preprocessed_image})
```

## Notes

- ONNX models are typically smaller and faster than PyTorch models
- Good for production deployment
- Cross-platform compatible
