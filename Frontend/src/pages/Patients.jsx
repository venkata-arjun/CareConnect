import { ArrowDownUp, Filter, Plus, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import RiskBadge from "../components/common/RiskBadge";
import StatusBadge from "../components/common/StatusBadge";
import { formatDate, formatDateTime, getPatients } from "../services/api";

function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [riskCategory, setRiskCategory] = useState("All");
  const [sort, setSort] = useState("updated-desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    getPatients()
      .then((data) => {
        if (isActive) setPatients(data);
      })
      .catch((requestError) => {
        if (isActive)
          setError(requestError.message || "Unable to load patients.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return patients
      .filter((patient) => status === "All" || patient.status === status)
      .filter(
        (patient) =>
          riskCategory === "All" || patient.riskCategory === riskCategory,
      )
      .filter(
        (patient) =>
          !query ||
          patient.name.toLowerCase().includes(query) ||
          patient.id.toLowerCase().includes(query) ||
          patient.email?.toLowerCase().includes(query),
      )
      .slice()
      .sort((first, second) => {
        if (sort === "name-asc") return first.name.localeCompare(second.name);
        if (sort === "risk-desc") return second.riskScore - first.riskScore;
        if (sort === "risk-asc") return first.riskScore - second.riskScore;

        const firstUpdated = new Date(first.updatedAt || 0).getTime();
        const secondUpdated = new Date(second.updatedAt || 0).getTime();
        return sort === "updated-asc"
          ? firstUpdated - secondUpdated
          : secondUpdated - firstUpdated;
      });
  }, [patients, riskCategory, search, sort, status]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
              All Patients
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review complete patient records and continue into follow-up.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-[minmax(220px,280px)_140px_130px_160px_auto] sm:items-center sm:gap-3">
            <label className="relative col-span-2 block sm:col-span-1">
              <span className="sr-only">Search patients</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search name, ID, or email"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Filter by status</span>
              <Filter
                aria-hidden="true"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.currentTarget.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-8 text-xs text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Filter by risk</span>
              <select
                value={riskCategory}
                onChange={(event) => setRiskCategory(event.currentTarget.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
              >
                <option value="All">All risk levels</option>
                <option value="HIGH">High risk</option>
                <option value="MEDIUM">Medium risk</option>
                <option value="LOW">Low risk</option>
              </select>
            </label>
            <label className="relative min-w-0">
              <span className="sr-only">Sort patients</span>
              <ArrowDownUp
                aria-hidden="true"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.currentTarget.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-8 text-xs text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm"
              >
                <option value="updated-desc">Updated: newest</option>
                <option value="updated-asc">Updated: oldest</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="risk-desc">Risk: high-low</option>
                <option value="risk-asc">Risk: low-high</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                navigate("/worklist", { state: { openAddPatient: true } })
              }
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Add Patient
            </button>
          </div>
        </div>

        {isLoading ? (
          <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">Loading patients...</p>
          </section>
        ) : error ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </section>
        ) : filteredPatients.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              No patients match your search.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    {[
                      "PATIENT ID",
                      "PATIENT NAME",
                      "CONTACT",
                      "DISCHARGE DATE",
                      "RISK",
                      "STATUS",
                      "NEXT FOLLOW-UP",
                      "LAST UPDATED",
                      "ACTION",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-4 text-[11px] font-semibold text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {patient.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                            <span className="text-[10px] font-semibold text-blue-600">
                              {patient.initials}
                            </span>
                          </div>
                          <span className="font-medium text-slate-700">
                            {patient.name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {patient.phone || patient.email || "Not available"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(patient.dischargeDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <RiskBadge category={patient.riskCategory} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge status={patient.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDateTime(patient.nextFollowUpDate) ===
                        "Not available"
                          ? "Not needed"
                          : formatDateTime(patient.nextFollowUpDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDateTime(patient.updatedAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/${patient.id}`)}
                          className="flex items-center gap-2 rounded-lg border border-blue-500 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <UserRound size={14} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Patients;
