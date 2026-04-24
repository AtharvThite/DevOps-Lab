import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { deletePipelineHistoryItem, getPipelineHistory } from "../services/api";

export default function HistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

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

  async function handleDelete(jobId) {
    const confirmed = window.confirm("Delete this pipeline run from history?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(jobId);
      await deletePipelineHistoryItem(jobId);
      setJobs((previousJobs) => previousJobs.filter((job) => job._id !== jobId));
      setError("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to delete history item.");
    } finally {
      setDeletingId("");
    }
  }

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
                  <th>Actions</th>
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
                    <td>
                      <button
                        type="button"
                        className="danger-link-btn"
                        onClick={() => handleDelete(job._id)}
                        disabled={deletingId === job._id}
                      >
                        {deletingId === job._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
