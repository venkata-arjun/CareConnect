function PrioritizationGuidance({ guidance }) {
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm sm:p-6">
      <h2 className="text-[11px] font-semibold tracking-wide text-slate-500">
        PRIORITIZATION GUIDANCE
      </h2>
      <div className="mt-4 inline-flex rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-amber-800">
        SUGGESTED: FOLLOW UP WITHIN 24H
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-700">
        {guidance || "No guidance available."}
      </p>
    </section>
  );
}

export default PrioritizationGuidance;
