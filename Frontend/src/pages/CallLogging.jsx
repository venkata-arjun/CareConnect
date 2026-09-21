import { ArrowLeft, BrainCircuit, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import CallOutcome from "../components/call/CallOutcome";
import CoordinatorNotes from "../components/call/CoordinatorNotes";
import NextAction from "../components/call/NextAction";
import { createCall, generateAISummary, getPatient } from "../services/api";

function getSavedDraft(patientId) {
  try {
    const savedDraft = JSON.parse(localStorage.getItem("followUpDraft"));
    return savedDraft?.patientId === patientId ? savedDraft : null;
  } catch {
    return null;
  }
}

function CallLogging() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const savedDraft = getSavedDraft(patientId);
  const [patient, setPatient] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [callOutcome, setCallOutcome] = useState(
    savedDraft?.callOutcome || "Successfully Contacted",
  );
  const [coordinatorNotes, setCoordinatorNotes] = useState(
    savedDraft?.coordinatorNotes || "",
  );
  const [nextAction, setNextAction] = useState(
    savedDraft?.nextAction || "Schedule Another Follow-Up",
  );
  const [scheduledAt, setScheduledAt] = useState(savedDraft?.scheduledAt || "");
  const [notesError, setNotesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function validate() {
    if (!callOutcome || coordinatorNotes.trim().length < 10) {
      setNotesError("Coordinator notes must be at least 10 characters.");
      return false;
    }

    setNotesError("");
    return true;
  }

  function saveDraft(extra = {}) {
    localStorage.setItem(
      "followUpDraft",
      JSON.stringify({
        patientId,
        callOutcome,
        coordinatorNotes: coordinatorNotes.trim(),
        nextAction,
        scheduledAt,
        callDateTime: new Date().toISOString(),
        coordinator:
          JSON.parse(localStorage.getItem("user") || "null")?.name ||
          "Current User",
        ...extra,
      }),
    );
  }

  async function handleSubmit(destination) {
    if (!validate() || !patient?.followUps?.[0]?.id) {
      if (!patient?.followUps?.[0]?.id)
        setNotesError("No follow-up record is available for this patient.");
      return;
    }

    setIsSubmitting(true);
    const followUpId = patient.followUps[0].id;

    try {
      if (destination === "ai-review") {
        const aiResult = await generateAISummary({
          patientId,
          followUpId,
          callOutcome,
          coordinatorNotes: coordinatorNotes.trim(),
          nextAction,
          scheduledAt: scheduledAt || null,
        });
        saveDraft({
          aiSummary: aiResult.summary,
          aiGuidance: aiResult.guidance,
          followUpId,
        });
        toast.success("AI summary generated");
      } else {
        const call = await createCall({
          followUpId,
          callOutcome,
          coordinatorNotes: coordinatorNotes.trim(),
          nextAction,
          scheduledAt: scheduledAt || null,
        });
        saveDraft({ activityId: call.id, followUpId });
        toast.success("Call saved");
      }
      navigate(`/patient/${patientId}/${destination}`);
    } catch (error) {
      saveDraft({ followUpId });
      if (destination === "ai-review" && error.status === 503) {
        navigate(`/patient/${patientId}/ai-unavailable`);
      } else {
        toast.error(error.message || "Unable to save call");
        navigate(`/patient/${patientId}/save-error`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || loadError || !patient) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <main className="mx-auto max-w-[900px] px-4 py-5 sm:px-6 sm:py-6">
          <section className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ArrowLeft size={20} className="text-slate-400" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-800 sm:text-xl">
              {loadError
                ? "Unable to Load Patient"
                : isLoading
                  ? "Loading Patient"
                  : "Patient Not Found"}
            </h1>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              {loadError ||
                (isLoading
                  ? "Please wait..."
                  : "We couldn't find a patient matching this ID.")}
            </p>
            {loadError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/worklist")}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:w-auto"
            >
              Back to Worklist
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-[1000px] px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-6">
        <button
          type="button"
          onClick={() => navigate(`/patient/${patientId}`)}
          className="mb-4 flex items-center gap-1.5 rounded-md px-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:mb-5"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Call Logging
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {patient.name}{" "}
            <span className="text-slate-400">({patient.id})</span>
          </p>
        </div>

        <form
          onSubmit={(event) => event.preventDefault()}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7"
        >
          <div className="border-b border-slate-200 pb-5 sm:pb-6">
            <h2 className="text-sm font-bold tracking-wide text-slate-800 sm:text-base">
              CALL INFORMATION &amp; OUTCOME
            </h2>
            <div className="mt-2 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:gap-6">
              <span>
                {savedDraft?.callDateTime || new Date().toLocaleString()}
              </span>
              <span>
                Coordinator:{" "}
                {JSON.parse(localStorage.getItem("user") || "null")?.name ||
                  "Current User"}
              </span>
            </div>
            <div className="mt-5 sm:mt-6">
              <CallOutcome value={callOutcome} onChange={setCallOutcome} />
            </div>
          </div>

          <div className="border-b border-slate-200 py-5 sm:py-6">
            <CoordinatorNotes
              value={coordinatorNotes}
              onChange={setCoordinatorNotes}
              error={notesError}
            />
          </div>

          <div className="py-5 sm:py-6">
            <NextAction value={nextAction} onChange={setNextAction} />
            {nextAction === "Schedule Another Follow-Up" && (
              <label className="mt-5 block max-w-sm text-sm font-medium text-slate-700">
                Next follow-up date
                <input
                  type="date"
                  value={scheduledAt}
                  onChange={(event) =>
                    setScheduledAt(event.currentTarget.value)
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Optional. Leave blank if a date is not needed yet.
                </span>
              </label>
            )}
          </div>

          {/* Desktop / tablet actions */}
          <div className="hidden border-t border-slate-200 pt-6 sm:flex sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(`/patient/${patientId}`)}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("activity-review")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("ai-review")}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BrainCircuit size={16} />
              Generate
            </button>
          </div>
        </form>
      </main>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-[1000px] gap-2">
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}`)}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("activity-review")}
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            Save
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("ai-review")}
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BrainCircuit size={16} />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

export default CallLogging;
