import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Phone,
  PhoneCall,
  UserX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../components/layout/Header";
import StatusBadge from "../components/common/StatusBadge";
import FollowUpOverview from "../components/patient/FollowUpOverview";
import PatientInfoCard from "../components/patient/PatientInfoCard";
import RiskInformation from "../components/patient/RiskInformation";
import {
  createFollowUp,
  getPatient,
  getPatientRisk,
} from "../services/api";

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2";

function Skeleton({ className = "" }) {
  return (
    <div
      className={`motion-safe:animate-pulse rounded-md bg-slate-200 ${className}`}
    />
  );
}

function PatientDetailsSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading patient details">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </section>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="mt-5 h-40 rounded-2xl" />
      <span className="sr-only">Loading patient details...</span>
    </div>
  );
}

function StartCallModal({ patient, isStarting, actionError, onClose, onDone }) {
  const dialogRef = useRef(null);
  const [callInitiated, setCallInitiated] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasPhone = Boolean(patient.phone);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isStarting) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isStarting, onClose]);

  async function copyPhone() {
    if (!patient.phone) return;

    try {
      await navigator.clipboard.writeText(patient.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-0 backdrop-blur-[2px] sm:items-center sm:px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isStarting) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-call-title"
        className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl outline-none sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="start-call-title"
              className="text-lg font-bold text-slate-900"
            >
              Start follow-up call
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Call the patient, then log the outcome.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isStarting}
            className={`rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 ${focusRing}`}
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="truncate text-base font-semibold text-slate-900">
            {patient.name}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Patient ID {patient.id}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
            {hasPhone ? (
              <>
                <p className="min-w-0 truncate text-lg font-semibold tracking-wide text-slate-900 tabular-nums">
                  {patient.phone}
                </p>
                <button
                  type="button"
                  onClick={copyPhone}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200/70 ${focusRing}`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-amber-800">
                <AlertCircle size={16} />
                No phone number is available for this patient.
              </p>
            )}
          </div>
        </div>

        {callInitiated && !actionError && (
          <p
            role="status"
            className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
          >
            <Check size={16} className="mt-0.5 shrink-0" />
            Dialer opened. When the call ends, select Log outcome.
          </p>
        )}
        {actionError && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {actionError}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isStarting}
            className={`rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 ${focusRing}`}
          >
            Cancel
          </button>
          {hasPhone ? (
            <a
              href={`tel:${patient.phone}`}
              onClick={() => setCallInitiated(true)}
              className={`flex items-center justify-center gap-2 rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 ${focusRing}`}
            >
              <Phone size={16} />
              Call patient
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 opacity-50"
            >
              <Phone size={16} />
              Call patient
            </button>
          )}
          <button
            type="button"
            onClick={onDone}
            disabled={isStarting}
            className={`rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
          >
            {isStarting ? "Preparing..." : "Log outcome"}
          </button>
        </div>
      </section>
    </div>
  );
}

function PatientDetails() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError("");

    Promise.all([getPatient(patientId), getPatientRisk(patientId)])
      .then(([patientData, riskData]) => {
        if (isActive) setPatient({ ...patientData, ...riskData });
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
  }, [patientId, reloadKey]);

  const closeModal = useCallback(() => {
    setIsCallModalOpen(false);
    setActionError("");
  }, []);

  function openModal() {
    setActionError("");
    setIsCallModalOpen(true);
  }

  async function finishCallSetup() {
    setIsStarting(true);
    setActionError("");
    try {
      const followUp =
        patient.followUps?.[0] ||
        (await createFollowUp({
          patientId: patient.id,
          status: "Pending",
          nextAction: "Conduct Outreach Call",
        }));
      navigate(`/patient/${patient.id}/call`, {
        state: { followUpId: followUp.id },
      });
    } catch (requestError) {
      setActionError(
        requestError.message || "Unable to start the follow-up. Try again.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  const callButton = (className = "") => (
    <button
      type="button"
      onClick={openModal}
      disabled={isStarting}
      className={`flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 ${focusRing} ${className}`}
    >
      <PhoneCall size={17} />
      Start call
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => navigate("/worklist")}
          className={`mb-4 flex items-center gap-1.5 rounded-md px-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 sm:mb-5 ${focusRing}`}
        >
          <ArrowLeft size={16} />
          Back to worklist
        </button>

        {isLoading ? (
          <PatientDetailsSkeleton />
        ) : error ? (
          <section
            role="alert"
            className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={22} className="text-red-600" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Could not load this patient
            </h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/worklist")}
                className={`rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 ${focusRing}`}
              >
                Back to worklist
              </button>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className={`rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 ${focusRing}`}
              >
                Try again
              </button>
            </div>
          </section>
        ) : !patient ? (
          <section className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <UserX size={22} className="text-slate-400" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-900 sm:text-xl">
              Patient not found
            </h1>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              No patient matches this ID. They may have been removed, or the
              link may be wrong.
            </p>
            <button
              type="button"
              onClick={() => navigate("/worklist")}
              className={`mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto ${focusRing}`}
            >
              Back to worklist
            </button>
          </section>
        ) : (
          <>
            <section
              aria-labelledby="patient-name"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100/60 sm:h-16 sm:w-16"
                  >
                    <span className="text-base font-semibold text-blue-700 sm:text-lg">
                      {patient.initials || "PT"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h1
                      id="patient-name"
                      className="truncate text-2xl font-bold leading-8 text-slate-900 sm:text-3xl sm:leading-9"
                    >
                      {patient.name}
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Patient ID {patient.id}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:justify-end">
                  <StatusBadge status={patient.status} />
                  {callButton("hidden lg:flex")}
                </div>
              </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <PatientInfoCard patient={patient} />
              <RiskInformation patient={patient} />
            </div>

            <div className="mt-5">
              <FollowUpOverview patient={patient} />
            </div>

            <div className="sticky bottom-0 -mx-4 mt-5 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:hidden">
              {callButton("w-full sm:ml-auto sm:w-auto")}
            </div>

            {isCallModalOpen && (
              <StartCallModal
                patient={patient}
                isStarting={isStarting}
                actionError={actionError}
                onClose={closeModal}
                onDone={finishCallSetup}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default PatientDetails;
