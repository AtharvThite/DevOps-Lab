import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import StatusBadge from "../components/StatusBadge";
import { getPipelineHistory } from "../services/api";

const COLORS = {
  success: "#34d399",
  failed: "#f87171",
  running: "#38bdf8",
  queued: "#64748b",
};

export default function HistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchHistory() {
    try {
      setLoading(true);
      const response = await getPipelineHistory();
      setJobs(response.jobs || []);
      setError("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const chartData = useMemo(() => {
    const counts = jobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      { success: 0, failed: 0, running: 0, queued: 0 }
    );

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  return (
    <section className="history-layout">
      <div className="panel">
        <div className="panel-heading row">
          <h2>Pipeline History</h2>
          <button className="secondary-btn" onClick={fetchHistory}>
            Refresh
          </button>
        </div>

        {loading && <p className="loading-text">Loading history...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && jobs.length === 0 && (
          <p className="empty-text">No pipeline jobs found. Start one from the Pipeline page.</p>
        )}

        {!loading && jobs.length > 0 && (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>{new Date(job.createdAt).toLocaleString()}</td>
                    <td>{job.repoUrl || job.filePath || "N/A"}</td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td>
                      <Link className="ghost-link" to={`/pipeline/${job._id}`}>
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel chart-panel">
        <div className="panel-heading">
          <h3>Run Distribution</h3>
          <p>Success and failure trend across all runs.</p>
        </div>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || "#9aa0ac"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
