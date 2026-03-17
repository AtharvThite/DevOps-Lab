import clsx from "clsx";

const STATUS_LABELS = {
  pending: "Pending",
  running: "Running",
  success: "Success",
  failed: "Failed",
  skipped: "Skipped",
  queued: "Queued",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={clsx("status-badge", {
        "status-success": status === "success",
        "status-failed": status === "failed",
        "status-running": status === "running",
        "status-pending": status === "pending" || status === "queued",
        "status-skipped": status === "skipped",
      })}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
