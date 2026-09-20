function RiskBadge({ category }) {
  const styles = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-green-100 text-green-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${styles[category] || "bg-slate-100 text-slate-700"}`}>
      {category}
    </span>
  );
}

export default RiskBadge;