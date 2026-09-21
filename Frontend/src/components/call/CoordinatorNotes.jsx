function CoordinatorNotes({ value, onChange, error }) {
  return (
    <div>
      <label
        htmlFor="coordinator-notes"
        className="text-[11px] font-semibold tracking-wide text-slate-500"
      >
        COORDINATOR NOTES
      </label>
      <textarea
        id="coordinator-notes"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? "coordinator-notes-error" : "coordinator-notes-help"
        }
        rows="5"
        className={`mt-3 min-h-32 w-full resize-y rounded-lg border bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
          error ? "border-red-400" : "border-slate-300"
        }`}
      />
      <div className="mt-1 flex justify-between gap-4 text-xs text-slate-400">
        <span id="coordinator-notes-help">
          Add relevant details from the outreach call.
        </span>
        <span>{value.length} characters</span>
      </div>
      {error && (
        <p
          id="coordinator-notes-error"
          role="alert"
          className="mt-2 text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default CoordinatorNotes;
