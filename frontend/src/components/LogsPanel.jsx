const STAGES = ["sonar", "terraform", "ansible", "deployment"];

export default function LogsPanel({ logs }) {
  return (
    <section className="panel logs-panel">
      <div className="panel-heading">
        <h3>Live Logs</h3>
        <p>Logs refresh automatically while the pipeline is running.</p>
      </div>

      <div className="logs-grid">
        {STAGES.map((stage) => (
          <div key={stage} className="log-column">
            <h4>{stage.toUpperCase()}</h4>
            <div className="log-stream">
              {(logs?.[stage] || []).length === 0 ? (
                <p className="log-placeholder">No logs available yet.</p>
              ) : (
                (logs[stage] || []).map((line, index) => (
                  <p key={`${stage}-${index}`} className="log-line">
                    {line}
                  </p>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
