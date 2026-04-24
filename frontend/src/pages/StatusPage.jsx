import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StageCard from "../components/StageCard";
import LogsPanel from "../components/LogsPanel";
import ProgressBar from "../components/ProgressBar";
import StatusBadge from "../components/StatusBadge";
import { getPipelineLogs, getPipelineStatus } from "../services/api";

const stageEntries = [
  ["SonarQube Scan", "sonar"],
  ["Terraform", "terraform"],
  ["Ansible", "ansible"],
  ["Deployment", "deployment"],
];

const terminalStates = new Set(["success", "failed"]);

export default function StatusPage() {
  const { id } = useParams();
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isTerminal = useMemo(() => terminalStates.has(status?.status), [status]);

  useEffect(() => {
    let alive = true;

    async function refreshData() {
      try {
        const [statusResponse, logsResponse] = await Promise.all([
          getPipelineStatus(id),
          getPipelineLogs(id),
        ]);

        if (!alive) {
          return;
        }

        setStatus(statusResponse);
        setLogs(logsResponse.logs);
        setError("");
      } catch (requestError) {
        if (alive) {
          setError(requestError?.response?.data?.message || "Unable to fetch pipeline status.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    refreshData();
    const intervalId = setInterval(() => {
      if (!isTerminal) {
        refreshData();
      }
    }, 2000);

    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, [id, isTerminal]);

  if (loading) {
    return <p className="loading-text">Loading pipeline status...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="status-layout">
      <div className="panel status-summary">
        <div className="panel-heading row">
          <h2>Pipeline Status</h2>
          <StatusBadge status={status?.status || "pending"} />
        </div>

        <p className="summary-line">
          Job ID: <strong>{id}</strong>
        </p>
        <p className="summary-line">
          Current Stage: <strong>{status?.currentStage || "queued"}</strong>
        </p>
        {status?.deployedUrl && (
          <p className="summary-line deployed-url-line">
            Deployed URL:{" "}
            <a
              href={status.deployedUrl}
              target="_blank"
              rel="noreferrer"
              className="deployed-url-link"
            >
              {status.deployedUrl}
            </a>
          </p>
        )}
        {status?.error && <p className="error-text">{status.error}</p>}

        <Link to="/history" className="ghost-link">
          View History
        </Link>
      </div>

      <ProgressBar stages={status?.stages} />

      <div className="stages-grid">
        {stageEntries.map(([label, key]) => (
          <StageCard key={key} title={label} stageKey={key} stage={status?.stages?.[key]} />
        ))}
      </div>

      <LogsPanel logs={logs} />
    </section>
  );
}
