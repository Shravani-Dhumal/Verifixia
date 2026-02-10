import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDetectionLogs } from "../../api";

type LogStatus = "threat" | "safe" | "review";

interface BackendLog {
  timestamp: string;
  filename: string;
  prediction: string;
  confidence: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  source: string;
  confidenceScore: number;
  status: LogStatus;
  actionTaken: string;
  duration: string;
}

function mapBackendToUiLogs(logs: BackendLog[]): LogEntry[] {
  return logs
    .slice()
    .reverse()
    .map((log, index) => {
      const confidencePercent =
        typeof log.confidence === "number"
          ? Math.round((log.confidence <= 1 ? log.confidence * 100 : log.confidence))
          : 0;

      let status: LogStatus = "review";
      if (log.prediction?.toLowerCase() === "fake") {
        status = confidencePercent >= 65 ? "threat" : "review";
      } else if (log.prediction?.toLowerCase() === "real") {
        status = "safe";
      }

      let actionTaken = "Pending Review";
      if (status === "threat") actionTaken = "Flagged & Quarantined";
      if (status === "safe") actionTaken = "Verified Authentic";

      const parsedTs = new Date(log.timestamp);
      const tsLabel = Number.isNaN(parsedTs.getTime())
        ? log.timestamp
        : parsedTs.toLocaleString();

      return {
        id: `DG-${String(index + 1).padStart(6, "0")}`,
        timestamp: tsLabel,
        sessionId: "UPLOAD",
        source: log.filename || "Upload Analysis",
        confidenceScore: confidencePercent,
        status,
        actionTaken,
        duration: "—",
      };
    });
}

const getStatusBadge = (status: LogEntry["status"]) => {
  switch (status) {
    case "threat":
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Threat
        </Badge>
      );
    case "safe":
      return (
        <Badge className="bg-success/20 text-success border-success/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Safe
        </Badge>
      );
    case "review":
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30">
          <Clock className="w-3 h-3 mr-1" />
          Review
        </Badge>
      );
  }
};

const getConfidenceColor = (score: number) => {
  if (score >= 70) return "text-destructive";
  if (score >= 40) return "text-warning";
  return "text-success";
};

export const ForensicLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rawLogs, setRawLogs] = useState<BackendLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await fetchDetectionLogs();
        if (!isMounted) return;
        setRawLogs(Array.isArray(data) ? data : []);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const uiLogs = useMemo(() => mapBackendToUiLogs(rawLogs), [rawLogs]);

  const filteredLogs = uiLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.id.toLowerCase().includes(q) ||
      log.sessionId.toLowerCase().includes(q) ||
      log.source.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forensic Logs</h1>
        <p className="text-muted-foreground">
          Review and analyze past detection sessions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {uiLogs.length.toString().padStart(2, "0")}
            </p>
            <p className="text-sm text-muted-foreground">Total Analyses</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-destructive">
              {uiLogs.filter((l) => l.status === "threat").length}
            </p>
            <p className="text-sm text-muted-foreground">Threats Detected</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-warning">
              {uiLogs.filter((l) => l.status === "review").length}
            </p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-success">
              {(() => {
                const total = uiLogs.length || 1;
                const safeCount = uiLogs.filter((l) => l.status === "safe").length;
                return `${((safeCount / total) * 100).toFixed(1)}%`;
              })()}
            </p>
            <p className="text-sm text-muted-foreground">Safe Classification Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, session, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="threat">Threat</SelectItem>
                  <SelectItem value="safe">Safe</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                {loading ? "Loading…" : "Export"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead>Detection ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action Taken</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-secondary/20">
                    <TableCell className="font-mono text-sm">{log.id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>{log.source}</TableCell>
                    <TableCell>
                      <span className={`font-mono font-bold ${getConfidenceColor(log.confidenceScore)}`}>
                        {log.confidenceScore}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.actionTaken}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.duration}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Download Report</DropdownMenuItem>
                          <DropdownMenuItem>Replay Session</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForensicLogs;
