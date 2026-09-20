import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import { createCall, generateAISummary, getPatient } from "../services/api";

function getSavedDraft() {
  try {
    return JSON.parse(localStorage.getItem("followUpDraft"));
  } catch {
    return null;
  }
}

function AIUnavailable() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const draft = getSavedDraft();
  const [patient, setPatient] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasDraft = draft?.patientId === patientId;
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");

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
    setIsRetrying(true);
    setRetryMessage("");
    try {
      const aiResult = await generateAISummary({
        patientId,
        followUpId: draft.followUpId || patient?.followUps?.[0]?.id,
        callOutcome: draft.callOutcome,
        coordinatorNotes: draft.coordinatorNotes,
        nextAction: draft.nextAction,
      });
      localStorage.setItem(
        "followUpDraft",
        JSON.stringify({
          ...draft,
          ...aiResult,
          followUpId: draft.followUpId || patient?.followUps?.[0]?.id,
        }),
      );
      navigate(`/patient/${patientId}/ai-review`);
    } catch {
      setIsRetrying(false);
      setRetryMessage(
        "AI connection is still unavailable. You can continue manually.",
      );
      toast.error("AI unavailable");
    }
    setIsRetrying(false);
  }

  async function handleContinue() {
    try {
      const call = await createCall({
        followUpId: draft.followUpId || patient?.followUps?.[0]?.id,
        callOutcome: draft.callOutcome,
        coordinatorNotes: draft.coordinatorNotes,
        nextAction: draft.nextAction,
      });
      localStorage.setItem(
        "followUpDraft",
        JSON.stringify({ ...draft, activityId: call.id }),
      );
      navigate(`/patient/${patientId}/activity-review`);
    } catch (error) {
      toast.error(error.message || "Unable to save call");
      navigate(`/patient/${patientId}/save-error`);
    }
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

  if (!hasDraft) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <main className="mx-auto max-w-[900px] p-4 sm:p-6">
          <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-800">
              Call Information Not Found
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Return to Call Logging to enter call information before
              continuing.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/patient/${patientId}/call`)}
              className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Return
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-[1000px] p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate(`/patient/${patientId}/call`)}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            AI Assistance Temporarily Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {patient.name} ({patient.id})
          </p>
        </div>

        <section
          className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm sm:p-6"
          role="status"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />
            <div className="space-y-2 text-sm leading-6 text-amber-950">
              <p className="font-semibold">
                AI summary and guidance are currently unavailable.
              </p>
              <p>You can continue manually.</p>
              <p>Primary care tracking is not blocked.</p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-slate-800">AI Summary</h2>
            <p className="mt-4 text-sm text-slate-500">Unavailable</p>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-slate-800">
              Prioritization Guidance
            </h2>
            <p className="mt-4 text-sm text-slate-500">Unavailable</p>
          </section>
        </div>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Call Information Preserved
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your previously entered call information is still intact.
              </p>
            </div>
            <span
              aria-hidden="true"
              className="hidden h-2.5 w-2.5 rounded-full bg-green-500 sm:block"
            />
          </div>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Call Outcome
              </dt>
              <dd className="mt-1 text-sm text-slate-700">
                {draft.callOutcome}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Coordinator Notes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {draft.coordinatorNotes}
              </dd>
            </div>
          </dl>
        </section>

        {retryMessage && (
          <p role="status" className="mt-4 text-sm text-slate-600">
            {retryMessage}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} />
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}

export default AIUnavailable;
