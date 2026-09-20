import { CheckCircle2, Clock3 } from "lucide-react";

function StatusBadge({ status }) {
  const isCompleted = status === "Completed";
  const Icon = isCompleted ? CheckCircle2 : Clock3;
  const style = isCompleted
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}
    >
      <Icon aria-hidden="true" size={13} strokeWidth={2.25} />
      {status}
    </span>
  );
}

export default StatusBadge;
