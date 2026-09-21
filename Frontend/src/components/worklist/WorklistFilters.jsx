import { ArrowDownUp, Filter } from "lucide-react";

function WorklistFilters({ status, sort, onStatusChange, onSortChange }) {
  return (
    <div className="flex w-full flex-row gap-3 sm:w-auto">
      <label className="relative min-w-0 flex-1 sm:w-auto sm:flex-none">
        <span className="sr-only">Filter by status</span>
        <Filter
          aria-hidden="true"
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <select
          value={status}
          onChange={(event) => onStatusChange(event.currentTarget.value)}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-8 pr-7 text-xs text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-48 sm:px-9 sm:pr-9 sm:text-sm"
        >
          <option value="All">Filter: All Statuses</option>
          <option value="Pending">Filter: Pending</option>
          <option value="Completed">Filter: Completed</option>
        </select>
      </label>

      <label className="relative min-w-0 flex-1 sm:w-auto sm:flex-none">
        <span className="sr-only">Sort worklist</span>
        <ArrowDownUp
          aria-hidden="true"
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <select
          value={sort}
          onChange={(event) => onSortChange(event.currentTarget.value)}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-8 pr-7 text-xs text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-36 sm:px-9 sm:pr-9 sm:text-sm"
        >
          <option value="updated-desc">Sort: Last Updated ↓</option>
          <option value="updated-asc">Sort: Last Updated ↑</option>
          <option value="risk-desc">Sort: Risk ↓</option>
          <option value="risk-asc">Sort: Risk ↑</option>
        </select>
      </label>
    </div>
  );
}

export default WorklistFilters;
