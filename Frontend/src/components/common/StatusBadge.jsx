function StatusBadge({ status }) {
  const style = status === "Completed"
    ? "bg-green-100 text-green-700"
    : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${style}`}>
      {status}
    </span>
  );
}

export default StatusBadge;