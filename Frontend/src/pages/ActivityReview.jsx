import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  PhoneCall,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import StatusBadge from "../components/common/StatusBadge";
import {
  getCall,
  getPatient,
  updateCall,
  updateFollowUpStatus,
} from "../services/api";

function getSavedDraft() {
  try {
    return JSON.parse(localStorage.getItem("followUpDraft"));
  } catch {
    return null;
  }
}

function NotFoundShell({ title, description, actionLabel, onAction }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-[900px] px-4 py-5 sm:px-6 sm:py-6">
        <section className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <ArrowLeft size={20} className="text-slate-400" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-800 sm:text-xl">
            {title}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
          <button
            type="button"
            onClick={onAction}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:w-auto"
          >
            {actionLabel}
          </button>
        </section>
      </main>
    </div>
  );
}

function ActivityReview() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const draft = getSavedDraft();
  const [patient, setPatient] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasDraft = draft?.patientId === patientId;
  const [finalAction, setFinalAction] = useState(
    draft?.nextAction === "Complete Follow-Up"
      ? "Complete Follow-Up"
      : "Schedule Additional Follow-Up",
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;
    const requests = [getPatient(patientId)];
    if (draft?.activityId) requests.push(getCall(draft.activityId));

    Promise.all(requests)
      .then(([patientData, activityData]) => {
        if (isActive) {
          setPatient(patientData);
          setActivity(activityData || null);
        }
      })
      .catch((error) => {
        if (isActive)
          setLoadError(error.message || "Unable to load activity data.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [patientId, draft?.activityId]);

  async function saveActivity(status) {
    setIsSaving(true);
    try {
      const updated = await updateCall(draft.activityId, {
        callOutcome: draft.callOutcome,
        coordinatorNotes: draft.coordinatorNotes,
        nextAction:
          finalAction === "Complete Follow-Up"
            ? "Complete Follow-Up"
            : "Schedule Another Follow-Up",
        aiSummary: draft.aiSummary || null,
        aiGuidance: draft.aiGuidance || null,
        status,
      });
      await updateFollowUpStatus(draft.followUpId, status);
      setActivity(updated);
      toast.success(
        status === "Completed" ? "Activity completed" : "Activity saved",
      );
      navigate("/worklist");
    } catch (error) {
      toast.error(error.message || "Unable to save activity");
      navigate(`/patient/${patientId}/save-error`);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || loadError || !patient) {
    return (
      <NotFoundShell
        title={
          loadError
            ? "Unable to Load Activity"
            : isLoading
              ? "Loading Activity"
              : "Patient Not Found"
        }
        description={
          loadError ||
          (isLoading
            ? "Please wait..."
            : "We couldn't find a patient matching this ID.")
        }
        actionLabel={loadError ? "Retry" : "Back to Worklist"}
        onAction={() =>
          loadError ? window.location.reload() : navigate("/worklist")
        }
      />
    );
  }

  if (!hasDraft || !draft.activityId) {
    return (
      <NotFoundShell
        title="Follow-Up Draft Not Found"
        description="Return to Call Logging to create a follow-up draft before reviewing this activity."
        actionLabel="Return to Call Logging"
        onAction={() => navigate(`/patient/${patientId}/call`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-[1100px] px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-6">
        <button
          type="button"
          onClick={() => navigate(`/patient/${patientId}/call`)}
          className="mb-4 flex items-center gap-1.5 rounded-md px-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:mb-5"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Summary Review
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {patient.name}{" "}
            <span className="text-slate-400">(ID: {patient.id})</span>
            <span className="mx-1.5 text-slate-300">·</span>
            Readmission Risk Score: {patient.riskScore} (
            {patient.riskCategory === "HIGH" ? "High" : patient.riskCategory})
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <PhoneCall
                aria-hidden="true"
                size={18}
                className="shrink-0 text-blue-600"
              />
              <h2 className="text-base font-bold text-slate-800">
                Call Details
              </h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm sm:mt-5 sm:space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-slate-500">Call Date/Time</dt>
                <dd className="font-medium text-slate-700 sm:text-right">
                  {activity?.dateTime
                    ? new Date(activity.dateTime).toLocaleString()
                    : draft.callDateTime || "Not available"}
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-slate-500">Coordinator</dt>
                <dd className="font-medium text-slate-700 sm:text-right">
                  {activity?.coordinator ||
                    draft.coordinator ||
                    "Not available"}
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-slate-500">Call Outcome</dt>
                <dd className="font-medium text-slate-700 sm:text-right">
                  {draft.callOutcome || "Not available"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-4 sm:mt-6 sm:pt-5">
              <div className="flex items-center gap-2">
                <FileText
                  aria-hidden="true"
                  size={17}
                  className="shrink-0 text-slate-500"
                />
                <h2 className="text-[11px] font-semibold tracking-wide text-slate-500">
                  COORDINATOR NOTES
                </h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {draft.coordinatorNotes}
              </p>
            </div>
          </section>

          <div className="space-y-4 sm:space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-[11px] font-semibold tracking-wide text-slate-500">
                AI SUMMARY
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-700 sm:mt-4">
                {draft.aiSummary || "No AI summary provided."}
              </p>
            </section>

            <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm sm:p-6">
              <h2 className="text-[11px] font-semibold tracking-wide text-blue-800">
                PRIORITIZATION GUIDANCE
              </h2>
              <p className="mt-3 text-sm leading-7 text-blue-950 sm:mt-4">
                {draft.aiGuidance || "No AI guidance provided."}
              </p>
            </section>
          </div>
        </div>

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Final Action
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose the activity outcome to save.
              </p>
            </div>
            <StatusBadge
              status={
                finalAction === "Complete Follow-Up" ? "Completed" : "Pending"
              }
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Schedule Additional Follow-Up", Clock3],
              ["Complete Follow-Up", CheckCircle2],
            ].map(([action, Icon]) => (
              <label
                key={action}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-blue-200 ${
                  finalAction === action
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="finalAction"
                  value={action}
                  checked={finalAction === action}
                  onChange={(event) => setFinalAction(event.target.value)}
                  className="h-4 w-4 shrink-0 accent-blue-600"
                />
                <Icon
                  aria-hidden="true"
                  size={17}
                  className={`shrink-0 ${finalAction === action ? "text-blue-600" : "text-slate-400"}`}
                />
                <span
                  className={`text-sm font-medium ${finalAction === action ? "text-blue-800" : "text-slate-700"}`}
                >
                  {action}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Clock3 aria-hidden="true" size={16} className="shrink-0" />
            <span>Callback Required</span>
          </div>
        </section>

        {/* Desktop / tablet actions */}
        <div className="mt-6 hidden border-t border-slate-200 pt-6 sm:flex sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}/call`)}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => saveActivity("Pending")}
            disabled={isSaving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => saveActivity("Completed")}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 size={17} />
            Confirm
          </button>
        </div>
      </main>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-[1100px] gap-2">
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}/call`)}
            className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => saveActivity("Pending")}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => saveActivity("Completed")}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 size={17} />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActivityReview;
