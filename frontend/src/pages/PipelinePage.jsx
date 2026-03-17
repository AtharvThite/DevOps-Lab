import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPipeline } from "../services/api";

export default function PipelinePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!repoUrl.trim() && !file) {
      setError("Enter a GitHub URL or upload a ZIP file.");
      return;
    }

    if (repoUrl.trim() && file) {
      setError("Please provide only one input: URL or ZIP.");
      return;
    }

    try {
      setLoading(true);
      const result = await runPipeline({
        repoUrl: repoUrl.trim(),
        file,
      });
      navigate(`/pipeline/${result.jobId}`);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to start pipeline.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel form-panel">
      <div className="panel-heading">
        <h2>Start New Pipeline</h2>
        <p>Provide source code using a repository URL or a ZIP archive.</p>
      </div>

      <form onSubmit={handleSubmit} className="pipeline-form">
        <label htmlFor="repo-url">GitHub Repository URL</label>
        <input
          id="repo-url"
          type="url"
          placeholder="https://github.com/org/repository"
          value={repoUrl}
          onChange={(event) => {
            setRepoUrl(event.target.value);
            if (event.target.value.trim()) {
              setFile(null);
            }
          }}
          disabled={Boolean(file)}
        />

        <div className="divider">OR</div>

        <label htmlFor="zip-upload">Upload Code ZIP</label>
        <input
          id="zip-upload"
          type="file"
          accept=".zip"
          onChange={(event) => {
            const selected = event.target.files?.[0] || null;
            setFile(selected);
            if (selected) {
              setRepoUrl("");
            }
          }}
          disabled={Boolean(repoUrl.trim())}
        />

        {error && <p className="error-text">{error}</p>}

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Starting..." : "Start Pipeline"}
        </button>
      </form>
    </section>
  );
}
