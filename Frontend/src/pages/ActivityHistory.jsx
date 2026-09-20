import { ArrowLeft, History } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import { getCallHistory, getPatient } from "../services/api";

function ActivityStatus({ status }) {
  const styles = {
    "Follow-Up Req.": "border-blue-200 bg-blue-50 text-blue-700",
    Pending: "border-amber-200 bg-amber-50 text-amber-800",
    Completed: "border-green-200 bg-green-50 text-green-700",
    System: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status] || "border-slate-200 bg-slate-50 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

function ActivityHistory() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [patientActivities, setPatientActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    Promise.all([getPatient(patientId), getCallHistory(patientId)])
      .then(([patientData, calls]) => {
        if (isActive) {
          setPatient(patientData);
          setPatientActivities(calls);
        }
      })
      .catch((requestError) => {
        if (isActive)
          setError(requestError.message || "Unable to load activity history.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [patientId]);

  if (isLoading || error || !patient) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <main className="mx-auto max-w-[900px] p-4 sm:p-6">
          <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-800">
              {error
                ? "Unable to Load Activity History"
                : isLoading
                  ? "Loading Activity History"
                  : "Patient Not Found"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {error ||
                (isLoading
                  ? "Please wait..."
                  : "Unable to find the requested patient.")}
            </p>
            {error && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/worklist")}
              className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Back
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-[1400px] p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate(`/patient/${patientId}`)}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History aria-hidden="true" size={20} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-800">
                Follow-Up Activity History
              </h1>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {patient.name}
              </span>
              <span aria-hidden="true">·</span>
              <span>{patient.id}</span>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {patientActivities.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              No follow-up activity found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <caption className="sr-only">
                  Follow-up activity history for {patient.name}
                </caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    {[
                      "Date/Time",
                      "Coordinator",
                      "Outcome",
                      "Coordinator Notes",
                      "AI Summary",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patientActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-700">
                        {new Date(activity.created_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {activity.coordinator}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {activity.callOutcome}
                      </td>
                      <td className="min-w-56 px-4 py-4 text-slate-600">
                        {activity.coordinatorNotes}
                      </td>
                      <td className="min-w-56 px-4 py-4 text-slate-600">
                        {activity.aiSummary}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <ActivityStatus status={activity.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ActivityHistory;
