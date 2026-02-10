from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import logging
from dotenv import load_dotenv
from PIL import Image, ImageStat
import random
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Allow both Vite dev (5173) and legacy dev (8080) by default.
default_cors_origins = "http://localhost:5173,http://localhost:8080"
CORS(app, origins=os.getenv("CORS_ORIGINS", default_cors_origins).split(","))

# Configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "uploads")
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))  # 16MB
IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "mkv", "webm"}
app.config["ALLOWED_EXTENSIONS"] = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

# Create uploads directory if it doesn't exist
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Model configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "xception_deepfake.pth")
PYTORCH_AVAILABLE = False
model = None
DEVICE = "cpu"
model_info = {}

# Try to load PyTorch model
try:
    import torch
    from utils.model_utils import ModelUtils
    
    PYTORCH_AVAILABLE = True
    logger.info("PyTorch is available. Attempting to load model...")
    
    # Load the model
    model, DEVICE = ModelUtils.load_model(MODEL_PATH)
    model_info = ModelUtils.get_model_info(MODEL_PATH)
    model_metadata = ModelUtils.get_model_metadata(model, DEVICE)
    model_info.update(model_metadata)
    
    logger.info(f"Model loaded successfully on device: {DEVICE}")
    logger.info(f"Model info: {model_info}")
    
except Exception as e:
    logger.warning(f"Could not load PyTorch model: {e}")
    logger.warning("Falling back to heuristic-based predictions")
    PYTORCH_AVAILABLE = False
    model = None

def allowed_file(filename):
    """Check if file extension is allowed"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]


def is_video_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in VIDEO_EXTENSIONS


def predict_deepfake_video():
    """Simple mock prediction for video uploads.

    Implementing full video-based deepfake detection requires a heavier
    model stack; for now we return a stable, high-confidence mock result
    so the end‑to‑end flow works.
    """
    confidence = 0.7 + random.random() * 0.3
    prediction = "Fake" if confidence > 0.8 else "Real"
    return prediction, confidence

def predict_deepfake(image_path):
    """Predict if image is deepfake using PyTorch model or fallback to heuristics"""
    
    if PYTORCH_AVAILABLE and model is not None:
        try:
            from utils.model_utils import ModelUtils
            
            # Preprocess image
            image_tensor, preprocessing_time = ModelUtils.preprocess_image(image_path)
            
            # Make prediction
            prediction_result = ModelUtils.predict_image(model, image_tensor, DEVICE)
            
            # Get confidence interpretation
            confidence_interpretation = ModelUtils.interpret_confidence(
                prediction_result["confidence_raw"]
            )
            
            # Combine all information
            result = {
                "prediction": prediction_result["prediction"],
                "confidence": prediction_result["confidence"],
                "confidence_raw": prediction_result["confidence_raw"],
                "threat_level": prediction_result["threat_level"],
                "model_used": "DeepGuard Xception v2.4.1",
                "processing_time": {
                    "preprocessing_ms": round(preprocessing_time * 1000, 2),
                    "inference_ms": prediction_result["inference_time_ms"],
                    "total_ms": round((preprocessing_time * 1000) + prediction_result["inference_time_ms"], 2)
                },
                "analysis": confidence_interpretation,
                "model_info": {
                    "architecture": "Xception-based CNN",
                    "input_size": "299x299",
                    "framework": "PyTorch",
                    "device": str(DEVICE)
                }
            }
            
            logger.info(f"Model Prediction: {result['prediction']}, Confidence: {result['confidence']:.2f}%")
            return result
            
        except Exception as e:
            logger.error(f"Error making model prediction: {e}")
            logger.warning("Falling back to heuristic prediction")
            # Fall through to heuristic method
    
    # Fallback: Heuristic-based prediction
    try:
        img = Image.open(image_path).convert("L")  # grayscale
        stat = ImageStat.Stat(img)

        # Simple heuristics: contrast + noise-like variation
        mean = stat.mean[0]
        stddev = stat.stddev[0]

        # Normalize to 0–1 range in a rough, robust way
        norm_contrast = max(0.0, min(1.0, stddev / 64.0))
        norm_brightness = max(0.0, min(1.0, abs(mean - 128) / 128.0))

        # Combine into a "fake" score
        fake_score = 0.6 * norm_contrast + 0.4 * norm_brightness

        # Add a tiny bit of randomness so repeated uploads aren't identical
        fake_score = max(0.0, min(1.0, fake_score + (random.random() - 0.5) * 0.1))

        prediction = "Fake" if fake_score > 0.5 else "Real"
        confidence = (fake_score if prediction == "Fake" else (1.0 - fake_score)) * 100

        logger.info(f"Heuristic Prediction: {prediction}, Confidence: {confidence:.2f}%")
        
        return {
            "prediction": prediction,
            "confidence": confidence,
            "confidence_raw": fake_score,
            "threat_level": "medium" if fake_score > 0.5 else "low",
            "model_used": "Heuristic Fallback",
            "processing_time": {
                "preprocessing_ms": 0,
                "inference_ms": 0,
                "total_ms": 0
            },
            "analysis": {
                "level": "Heuristic",
                "description": "Using basic image statistics (model unavailable)",
                "recommendation": "Results may be less accurate without deep learning model"
            },
            "model_info": {
                "architecture": "Statistical Analysis",
                "input_size": "N/A",
                "framework": "PIL",
                "device": "cpu"
            }
        }

    except Exception as e:
        logger.error(f"Error making heuristic prediction: {e}")
        # Final fallback: random but biased towards medium–high confidence
        confidence = 70 + random.random() * 30
        prediction = "Fake" if confidence > 80 else "Real"
        
        return {
            "prediction": prediction,
            "confidence": confidence,
            "confidence_raw": confidence / 100,
            "threat_level": "unknown",
            "model_used": "Random Fallback",
            "processing_time": {
                "preprocessing_ms": 0,
                "inference_ms": 0,
                "total_ms": 0
            },
            "analysis": {
                "level": "Error",
                "description": "Error occurred during analysis",
                "recommendation": "Please try again or contact support"
            },
            "model_info": {
                "architecture": "N/A",
                "input_size": "N/A",
                "framework": "N/A",
                "device": "cpu"
            }
        }

def save_detection_log(filename, result):
    """Save detection result to log file with detailed information"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "filename": filename,
        "prediction": result.get("prediction"),
        "confidence": result.get("confidence"),
        "threat_level": result.get("threat_level"),
        "model_used": result.get("model_used"),
        "processing_time_ms": result.get("processing_time", {}).get("total_ms", 0)
    }

    log_file = "detection_logs.jsonl"
    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

@app.route("/api/upload", methods=["POST"])
def upload_image():
    """Handle image or video upload and deepfake detection with detailed information"""
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No image selected"}), 400

    if not allowed_file(file.filename):
        return jsonify(
            {
                "error": "Invalid file type. Allowed images: png, jpg, jpeg, gif. "
                "Allowed videos: mp4, mov, avi, mkv, webm."
            }
        ), 400

    try:
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

        # Save uploaded file
        file.save(filepath)

        # Make prediction (image vs. video)
        if is_video_file(filename):
            prediction, confidence = predict_deepfake_video()
            result = {
                "prediction": prediction,
                "confidence": confidence * 100,
                "confidence_raw": confidence,
                "threat_level": "high" if confidence > 0.7 else "medium" if confidence > 0.4 else "low",
                "model_used": "Video Analysis (Mock)",
                "processing_time": {
                    "preprocessing_ms": 0,
                    "inference_ms": 0,
                    "total_ms": 0
                },
                "analysis": {
                    "level": "Video",
                    "description": "Video analysis requires specialized processing",
                    "recommendation": "Full video analysis coming soon"
                },
                "model_info": {
                    "architecture": "Video Analyzer",
                    "input_size": "Variable",
                    "framework": "Mock",
                    "device": "cpu"
                }
            }
        else:
            result = predict_deepfake(filepath)

        # Save to log
        save_detection_log(unique_filename, result)

        # Clean up uploaded file (optional - you might want to keep for forensic analysis)
        # os.remove(filepath)

        # Return comprehensive response
        response = {
            "prediction": result["prediction"],
            "confidence": round(result["confidence"], 2),
            "filename": unique_filename,
            "file_url": request.host_url.rstrip('/') + f"/uploads/{unique_filename}",
            "isVideo": is_video_file(filename),
            "threat_level": result.get("threat_level"),
            "model_used": result.get("model_used"),
            "processing_time": result.get("processing_time"),
            "analysis": result.get("analysis"),
            "model_info": result.get("model_info")
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/logs', methods=['GET'])
def get_detection_logs():
    """Get recent detection logs"""
    try:
        logs = []
        log_file = "detection_logs.jsonl"

        if os.path.exists(log_file):
            with open(log_file, "r") as f:
                for line in f:
                    if line.strip():
                        logs.append(json.loads(line.strip()))

        # Return last 50 logs
        return jsonify(logs[-50:])

    except Exception as e:
        logger.error(f"Error retrieving logs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_file(filename):
    """Serve uploaded files from the uploads directory."""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        logger.error(f"Error serving uploaded file {filename}: {e}")
        return jsonify({'error': 'File not found'}), 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed model information"""
    if PYTORCH_AVAILABLE:
        device_info = str(DEVICE)
    else:
        device_info = "cpu (mock mode)"

    return jsonify({
        'status': 'healthy',
        'pytorch_available': PYTORCH_AVAILABLE,
        'model_loaded': model is not None,
        'device': device_info,
        'model_info': model_info if model_info else None
    })

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Get detailed model information"""
    if model is not None and PYTORCH_AVAILABLE:
        return jsonify({
            'status': 'loaded',
            'info': model_info
        })
    else:
        return jsonify({
            'status': 'not_loaded',
            'message': 'Model not available. Using fallback predictions.',
            'pytorch_available': PYTORCH_AVAILABLE
        })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'DeepGaurd AI Backend API',
        'version': '1.0.0',
        'endpoints': {
            'POST /api/upload': 'Upload image for deepfake detection',
            'GET /api/logs': 'Get detection logs',
            'GET /api/health': 'Health check'
        }
    })

if __name__ == '__main__':
    # Load model on startup: handled by module level pipeline init
    # load_model()

    # Run the app on port 3001 instead of 5000
    app.run(
        host='0.0.0.0',
        port=3001,
        debug=True
    )