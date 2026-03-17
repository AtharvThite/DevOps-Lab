const ORDER = ["sonar", "terraform", "ansible", "deployment"];

function stageWeight(status) {
  if (status === "success") return 1;
  if (status === "running") return 0.5;
  if (status === "failed") return 1;
  return 0;
}

export default function ProgressBar({ stages }) {
  const total = ORDER.length;
  const progressValue = ORDER.reduce((sum, key) => {
    const status = stages?.[key]?.status || "pending";
    return sum + stageWeight(status);
  }, 0);

  const percentage = Math.round((progressValue / total) * 100);

  return (
    <section className="panel">
      <div className="panel-heading row">
        <h3>Pipeline Progress</h3>
        <strong>{percentage}%</strong>
      </div>

      <div className="progress-track" role="progressbar" aria-valuenow={percentage}>
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}
