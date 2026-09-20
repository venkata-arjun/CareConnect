import { Plus, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import RiskBadge from "../components/common/RiskBadge";
import StatusBadge from "../components/common/StatusBadge";
import { formatDate, getPatients } from "../services/api";

function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
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
    if (!query) return patients;

    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query),
    );
  }, [patients, search]);

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
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <label className="relative block w-full sm:w-80">
              <span className="sr-only">Search patients</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, ID, or email"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
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
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    {[
                      "PATIENT ID",
                      "PATIENT NAME",
                      "CONTACT",
                      "DISCHARGE DATE",
                      "RISK",
                      "STATUS",
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
