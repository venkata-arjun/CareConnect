import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import { createCall, getPatient } from "../services/api";

function SaveError() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");

  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem("followUpDraft"));
  } catch {
    draft = null;
  }

  useEffect(() => {
    let isActive = true;
    getPatient(patientId)
      .then((patientData) => {
        if (isActive) setPatient(patientData);
      })
      .catch((error) => {
        if (isActive)
          setLoadError(error.message || "Unable to load patient data.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [patientId]);

  async function handleRetry() {
    if (!draft?.callOutcome || draft.coordinatorNotes?.trim().length < 10) {
      navigate(`/patient/${patientId}/call`);
      return;
    }

    setIsRetrying(true);
    setRetryMessage("");
    try {
      const call = await createCall({
        followUpId: draft?.followUpId || patient?.followUps?.[0]?.id,
        callOutcome: draft?.callOutcome,
        coordinatorNotes: draft.coordinatorNotes.trim(),
        nextAction: draft?.nextAction,
        scheduledAt: draft?.scheduledAt || null,
        aiSummary: draft?.aiSummary || null,
        aiGuidance: draft?.aiGuidance || null,
      });
      localStorage.setItem(
        "followUpDraft",
        JSON.stringify({ ...draft, activityId: call.id }),
      );
      toast.success("Call saved");
      navigate(`/patient/${patientId}/activity-review`);
    } catch (error) {
      setIsRetrying(false);
      setRetryMessage(
        error.message ||
          "Retry unsuccessful. Please review the errors and try again.",
      );
      toast.error("Retry failed");
    }
    setIsRetrying(false);
  }

  if (isLoading || loadError || !patient) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <main className="mx-auto max-w-[900px] p-4 sm:p-6">
          <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-800">
              {loadError
                ? "Unable to Load Patient"
                : isLoading
                  ? "Loading Patient"
                  : "Patient Not Found"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {loadError ||
                (isLoading
                  ? "Please wait..."
                  : "Unable to find the requested patient.")}
            </p>
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

      <main className="mx-auto flex max-w-[900px] justify-center p-4 sm:p-6">
        <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle
                aria-hidden="true"
                size={22}
                className="text-red-600"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Unable to Save Follow-Up
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The activity could not be saved. Please review the errors below.
              </p>
              <p className="mt-2 text-xs font-medium text-slate-400">
                Patient: {patient.name} ({patient.id})
              </p>
            </div>
          </div>

          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50/70 p-4"
            role="alert"
            aria-labelledby="save-errors-title"
          >
            <h2
              id="save-errors-title"
              className="text-sm font-semibold text-red-800"
            >
              Save validation errors
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-red-700">
              {[
                "Call outcome and coordinator notes are required.",
                "Coordinator notes must contain at least 10 characters.",
                "The previous API save failed; retry the actual request.",
              ].map((error) => (
                <li key={error} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                  />
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>

          {retryMessage && (
            <p role="status" className="mt-4 text-sm text-slate-600">
              {retryMessage}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(`/patient/${patientId}/call`)}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <ArrowLeft size={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshCw
                size={16}
                className={isRetrying ? "animate-spin" : ""}
              />
              {isRetrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SaveError;
