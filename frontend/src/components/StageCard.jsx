import StatusBadge from "./StatusBadge";

export default function StageCard({ title, stageKey, stage }) {
  const logsCount = stage?.logs?.length || 0;

  return (
    <article className="stage-card">
      <div className="stage-head">
        <div>
          <h4>{title}</h4>
          <p className="stage-key">{stageKey}</p>
        </div>
        <StatusBadge status={stage?.status || "pending"} />
      </div>

      <div className="stage-meta">
        <span>Logs: {logsCount}</span>
        <span>
          Started: {stage?.startedAt ? new Date(stage.startedAt).toLocaleTimeString() : "-"}
        </span>
      </div>
    </article>
  );
}
