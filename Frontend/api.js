const API_BASE = "http://localhost:3001"; // Flask backend URL (port 3001)

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Backend did not return valid JSON", e);
      throw new Error("Invalid response from backend");
    }

    if (!res.ok || (data && data.error)) {
      console.error("Backend returned error", res.status, data);
      throw new Error(data?.error || `Backend error: ${res.status}`);
    }

    // Return the complete response with all detailed information
    return data;
  } catch (error) {
    console.warn("Upload to backend failed, falling back to mock response:", error);
    // Fallback to mock behaviour so UI still works even if backend is down
    return mockUploadResponse();
  }
}

export async function fetchModelInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/model-info`);

    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Backend did not return valid JSON for /api/model-info", e);
      throw new Error("Invalid response from backend");
    }

    if (!res.ok || (data && data.error)) {
      console.error("Backend returned error for /api/model-info", res.status, data);
      throw new Error(data?.error || `Backend error: ${res.status}`);
    }

    return data;
  } catch (error) {
    console.warn("Fetching model info failed:", error);
    return {
      status: "not_loaded",
      message: "Model information unavailable"
    };
  }
}

export async function fetchDetectionLogs() {
  try {
    const res = await fetch(`${API_BASE}/api/logs`);

    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Backend did not return valid JSON for /api/logs", e);
      throw new Error("Invalid response from backend");
    }

    if (!res.ok || (data && data.error)) {
      console.error("Backend returned error for /api/logs", res.status, data);
      throw new Error(data?.error || `Backend error: ${res.status}`);
    }

    return data;
  } catch (error) {
    console.warn("Fetching detection logs failed, falling back to mock logs:", error);
    return mockLogsResponse();
  }
}

function mockUploadResponse() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const isFake = Math.random() > 0.5;
      const confidence = 70 + Math.random() * 30;
      
      resolve({
        prediction: isFake ? "Fake" : "Real",
        confidence: confidence,
        filename: "mock_upload.jpg",
        isVideo: false,
        threat_level: confidence > 80 ? "high" : confidence > 50 ? "medium" : "low",
        model_used: "Mock Model (Backend Unavailable)",
        processing_time: {
          preprocessing_ms: 10 + Math.random() * 20,
          inference_ms: 50 + Math.random() * 100,
          total_ms: 60 + Math.random() * 120
        },
        analysis: {
          level: "Mock",
          description: "Backend unavailable. Using mock prediction.",
          recommendation: "Please ensure backend server is running for accurate results."
        },
        model_info: {
          architecture: "N/A",
          input_size: "N/A",
          framework: "Mock",
          device: "cpu"
        }
      });
    }, 800);
  });
}

function mockLogsResponse() {
  const now = new Date();
  const entries = [];

  for (let i = 0; i < 12; i++) {
    const ts = new Date(now.getTime() - i * 5 * 60_000).toISOString();
    const isFake = Math.random() > 0.6;
    const confidence = 0.6 + Math.random() * 0.35;

    entries.push({
      timestamp: ts,
      filename: `mock_upload_${String(i + 1).padStart(3, "0")}.jpg`,
      prediction: isFake ? "Fake" : "Real",
      confidence,
    });
  }

  return entries;
}
