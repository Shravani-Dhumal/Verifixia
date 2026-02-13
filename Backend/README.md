# DeepGaurd Backend API

A Flask-based REST API for deepfake detection using PyTorch models.

## Features

- **Image Upload & Analysis**: Upload images for deepfake detection
- **PyTorch Model Integration**: Uses trained deepfake detection models
- **RESTful API**: Clean endpoints for frontend integration
- **Detection Logging**: Logs all detection results for analysis
- **CORS Support**: Ready for frontend integration

## API Endpoints

### POST /api/upload
Upload an image for deepfake detection.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
```json
{
  "prediction": "Fake",
  "confidence": 0.87,
  "filename": "uuid_filename.jpg"
}
```

### GET /api/logs
Get recent detection logs.

**Response:**
```json
[
  {
    "timestamp": "2024-01-27T10:30:00",
    "filename": "uuid_filename.jpg",
    "prediction": "Fake",
    "confidence": 0.87
  }
]
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

## Setup

1. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

2. **Train Model (Optional):**
```bash
cd pytorch
python train_improved.py
```

3. **Run the API:**
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Project Structure

```
Backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── pytorch/
│   ├── train_improved.py  # Model training script
│   └── config.yaml        # Training configuration
├── utils/
│   ├── __init__.py
│   └── model_utils.py     # Model utility functions
└── uploads/               # Temporary uploaded files
```

## Model Training

The system uses an Xception-based architecture for deepfake detection. To train your own model:

1. Prepare your dataset in the expected format
2. Update `pytorch/config.yaml` with your settings
3. Run the training script

## Integration with Frontend

Update the `API_BASE` in `frontend/api.js` to point to the backend:

```javascript
const API_BASE = "http://localhost:5000";
```

Then uncomment the real API calls and comment out the mock responses.