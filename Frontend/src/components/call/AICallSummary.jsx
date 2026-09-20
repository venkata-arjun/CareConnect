function AICallSummary({ summary }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-[11px] font-semibold tracking-wide text-slate-500">
        GENERATED CALL SUMMARY
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-700">
        {summary || "No summary available."}
      </p>
    </section>
  );
}

export default AICallSummary;
