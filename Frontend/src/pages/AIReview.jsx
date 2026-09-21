import { ArrowLeft, Check, Edit3 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import AIAdvisoryBanner from "../components/call/AIAdvisoryBanner";
import AICallSummary from "../components/call/AICallSummary";
import PrioritizationGuidance from "../components/call/PrioritizationGuidance";
import Header from "../components/layout/Header";
import { createCall, getPatient } from "../services/api";

function getSavedDraft() {
  try {
    return JSON.parse(localStorage.getItem("followUpDraft"));
  } catch {
    return null;
  }
}

function AIReview() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const draft = getSavedDraft();

  useEffect(() => {
    let isActive = true;
    getPatient(patientId)
      .then((patientData) => {
        if (isActive) setPatient(patientData);
      })
      .catch((requestError) => {
        if (isActive)
          setError(requestError.message || "Unable to load patient data.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [patientId]);

  async function handleAccept() {
    try {
      const call = await createCall({
        followUpId: draft?.followUpId || patient?.followUps?.[0]?.id,
        callOutcome: draft?.callOutcome,
        coordinatorNotes: draft?.coordinatorNotes,
        nextAction: draft?.nextAction,
        scheduledAt: draft?.scheduledAt,
        aiSummary: draft?.aiSummary,
        aiGuidance: draft?.aiGuidance,
      });
      localStorage.setItem(
        "followUpDraft",
        JSON.stringify({ ...draft, activityId: call.id }),
      );
      toast.success("Review accepted");
      navigate(`/patient/${patientId}/activity-review`);
    } catch (requestError) {
      toast.error(requestError.message || "Unable to save AI review");
      navigate(`/patient/${patientId}/save-error`);
    }
  }

  if (isLoading || error || !patient) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <main className="mx-auto max-w-[900px] px-4 py-5 sm:px-6 sm:py-6">
          <section className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ArrowLeft size={20} className="text-slate-400" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-800 sm:text-xl">
              {error
                ? "Unable to Load Patient"
                : isLoading
                  ? "Loading Patient"
                  : "Patient Not Found"}
            </h1>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              {error ||
                (isLoading
                  ? "Please wait..."
                  : "We couldn't find a patient matching this ID.")}
            </p>
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
          onClick={() => navigate(`/patient/${patientId}/call`)}
          className="mb-4 flex items-center gap-1.5 rounded-md px-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:mb-5"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Follow-Up Review
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {patient.name}{" "}
            <span className="text-slate-400">({patient.id})</span>
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <AIAdvisoryBanner />
          <AICallSummary summary={draft?.aiSummary} />
          <PrioritizationGuidance guidance={draft?.aiGuidance} />
        </div>

        {/* Desktop / tablet actions */}
        <div className="mt-6 hidden border-t border-slate-200 pt-6 sm:flex sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}/call`)}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          >
            <Edit3 size={16} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}/call`)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            Return
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800"
          >
            <Check size={16} />
            Accept
          </button>
        </div>
      </main>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-[1000px] items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}/call`)}
            aria-label="Edit"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}/call`)}
            className="flex flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            Return
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800"
          >
            <Check size={16} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIReview;
