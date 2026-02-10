import { useState, useEffect, useCallback } from "react";
import { Clock, Gauge, ScanFace } from "lucide-react";
import { toast } from "sonner";

import { VideoFeed } from "@/components/dashboard/VideoFeed";
import { ConfidenceGauge } from "@/components/dashboard/ConfidenceGauge";
import { DetectionLog, LogEntry } from "@/components/dashboard/DetectionLog";
import { SecurityScore } from "@/components/dashboard/SecurityScore";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { AnalysisSummary } from "@/components/dashboard/AnalysisSummary";
import { ModelInfo } from "@/components/dashboard/ModelInfo";
import { uploadImage } from "../../api";

const MOCK_LOG_MESSAGES = [
  { message: "Biometric Mismatch Detected", type: "error" as const },
  { message: "Skin Texture Anomaly", type: "warning" as const },
  { message: "Facial Landmarks Verified", type: "success" as const },
  { message: "Micro-Expression Analysis Complete", type: "info" as const },
  { message: "Lip Sync Deviation Detected", type: "warning" as const },
  { message: "Eye Reflection Inconsistency", type: "error" as const },
  { message: "Frame Integrity Check Passed", type: "success" as const },
  { message: "Neural Network Confidence: High", type: "info" as const },
  { message: "Temporal Consistency Warning", type: "warning" as const },
  { message: "GAN Artifact Signature Found", type: "error" as const },
];

export const Dashboard = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sensitivity, setSensitivity] = useState(65);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [securityScore, setSecurityScore] = useState(87);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [latency, setLatency] = useState(42);
  const [fps, setFps] = useState(30);
  const [facesScanned, setFacesScanned] = useState(1247);
  const [threatLevel, setThreatLevel] = useState<"safe" | "warning" | "danger">("safe");
  const [lastPrediction, setLastPrediction] = useState<"Real" | "Fake" | "Unknown">("Unknown");
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [lastFilename, setLastFilename] = useState<string | undefined>(undefined);
  const [lastIsVideo, setLastIsVideo] = useState<boolean | undefined>(undefined);
  const [lastThreatLevel, setLastThreatLevel] = useState<string | undefined>(undefined);
  const [lastModelUsed, setLastModelUsed] = useState<string | undefined>(undefined);
  const [lastAnalysis, setLastAnalysis] = useState<any>(undefined);
  const [lastModelInfo, setLastModelInfo] = useState<any>(undefined);
  const [lastProcessingTime, setLastProcessingTime] = useState<any>(undefined);

  const addLogEntry = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + "." + now.getMilliseconds().toString().padStart(3, "0");

    const newEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp,
      ...entry,
    };

    setLogs((prev) => [newEntry, ...prev].slice(0, 50));
  }, []);

  // Simulate monitoring activity
  useEffect(() => {
    if (!isMonitoring) {
      setThreatLevel("safe");
      return;
    }

    // Random confidence score fluctuation
    const scoreInterval = setInterval(() => {
      const baseScore = Math.random() * 100;
      const adjustedScore = Math.min(100, baseScore * (sensitivity / 50));
      setConfidenceScore(Math.round(adjustedScore));

      // Keep lastPrediction in sync with simulated monitoring
      if (adjustedScore >= 70) {
        setLastPrediction("Fake");
        setLastConfidence(adjustedScore);
      } else if (adjustedScore <= 30) {
        setLastPrediction("Real");
        setLastConfidence(100 - adjustedScore);
      }

      // Update threat level based on score
      if (adjustedScore >= 70) {
        setThreatLevel("danger");
      } else if (adjustedScore >= 40) {
        setThreatLevel("warning");
      } else {
        setThreatLevel("safe");
      }
    }, 2000);

    // Random log entries
    const logInterval = setInterval(() => {
      const randomLog = MOCK_LOG_MESSAGES[Math.floor(Math.random() * MOCK_LOG_MESSAGES.length)];
      addLogEntry(randomLog);
    }, 3000);

    // Random metric updates
    const metricInterval = setInterval(() => {
      setLatency(35 + Math.floor(Math.random() * 30));
      setFps(28 + Math.floor(Math.random() * 5));
      setFacesScanned((prev) => prev + Math.floor(Math.random() * 3));
    }, 1500);

    return () => {
      clearInterval(scoreInterval);
      clearInterval(logInterval);
      clearInterval(metricInterval);
    };
  }, [isMonitoring, sensitivity, addLogEntry]);

  // Trigger alert toast when deepfake detected
  useEffect(() => {
    if (threatLevel === "danger" && isMonitoring) {
      toast.error("⚠️ DEEPFAKE DETECTED", {
        description: "High probability of synthetic media manipulation detected in video feed.",
        duration: 5000,
        className: "cyber-glow-red",
      });
    }
  }, [threatLevel, isMonitoring]);

  const handleStartStop = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      addLogEntry({ message: "Monitoring session started", type: "info" });
      toast.success("Monitoring Started", {
        description: "Verifixia is now analyzing the video feed.",
      });
    } else {
      addLogEntry({ message: "Monitoring session ended", type: "info" });
      setConfidenceScore(0);
      toast.info("Monitoring Stopped", {
        description: "Video analysis has been paused.",
      });
    }
  };

  const handleUploadMedia = async (file: File) => {
    addLogEntry({
      message: `Upload received: "${file.name}". Running deepfake analysis...`,
      type: "info",
    });

    try {
      const result = await uploadImage(file);

      const prediction =
        result?.prediction ??
        (result?.isFake === true ? "Fake" : result?.isFake === false ? "Real" : "Unknown");

      const rawConfidence = typeof result?.confidence === "string"
        ? parseFloat(result.confidence)
        : result?.confidence;

      if (typeof rawConfidence === "number" && !Number.isNaN(rawConfidence)) {
        const percentScore = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
        setConfidenceScore(Math.round(Math.min(100, Math.max(0, percentScore))));
        setLastConfidence(percentScore);
      }

      setLastPrediction(prediction as "Real" | "Fake" | "Unknown");
      setLastFilename(result?.filename ?? file.name);
      setLastIsVideo(result?.isVideo === true);
      setLastThreatLevel(result?.threat_level);
      setLastModelUsed(result?.model_used);
      setLastAnalysis(result?.analysis);
      setLastModelInfo(result?.model_info);
      setLastProcessingTime(result?.processing_time);

      // Add detailed log entry
      const logMessage = result?.model_used 
        ? `Analysis complete using ${result.model_used}: ${prediction} (${Math.round(rawConfidence || 0)}%)`
        : `Analysis complete for "${file.name}": ${prediction}`;

      addLogEntry({
        message: logMessage,
        type: prediction === "Fake" ? "error" : prediction === "Real" ? "success" : "info",
      });

      // Show detailed toast
      const toastDescription = result?.processing_time?.total_ms
        ? `Confidence: ${Math.round(rawConfidence || 0)}% | Processing: ${result.processing_time.total_ms.toFixed(1)}ms`
        : typeof rawConfidence === "number"
        ? `Confidence: ${Math.round(rawConfidence)}%`
        : "Confidence score not available.";

      toast.success(`Media analysis complete (${prediction})`, {
        description: toastDescription,
      });
    } catch (error) {
      console.error("Upload failed", error);
      addLogEntry({
        message: `Analysis failed for "${file.name}". Please try again.`,
        type: "error",
      });
      toast.error("Media analysis failed", {
        description: "Could not analyze the uploaded file. Please try again.",
      });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6">
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Video Feed & Gauge */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <VideoFeed isMonitoring={isMonitoring} threatLevel={threatLevel} />
          <ConfidenceGauge value={confidenceScore} isMonitoring={isMonitoring} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4 md:space-y-6">
          <SecurityScore score={securityScore} trend="up" />
          <ControlPanel
            isMonitoring={isMonitoring}
            sensitivity={sensitivity}
            onStartStop={handleStartStop}
            onSensitivityChange={setSensitivity}
            onUploadMedia={handleUploadMedia}
          />
          <ModelInfo
            modelData={lastModelInfo}
            processingTime={lastProcessingTime}
            isLoaded={!!lastModelUsed}
          />
          <AnalysisSummary
            prediction={lastPrediction}
            confidence={lastConfidence}
            filename={lastFilename}
            isVideo={lastIsVideo}
            threatLevel={lastThreatLevel}
            modelUsed={lastModelUsed}
            analysis={lastAnalysis}
          />
          <div className="h-[300px]">
            <DetectionLog logs={logs} />
          </div>
        </div>
      </div>

      {/* Bottom Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Average Latency"
          value={latency}
          unit="ms"
          icon={Clock}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Frame Analysis Rate"
          value={fps}
          unit="FPS"
          icon={Gauge}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Total Faces Scanned"
          value={facesScanned.toLocaleString()}
          icon={ScanFace}
        />
      </div>
    </div>
  );
};

export default Dashboard;
