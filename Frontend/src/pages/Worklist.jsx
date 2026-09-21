import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  ClipboardList,
  HeartPulse,
  Plus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import StatsCard from "../components/common/StatsCard";
import SearchBar from "../components/worklist/SearchBar";
import WorklistFilters from "../components/worklist/WorklistFilters";
import WorklistTable from "../components/worklist/WorklistTable";
import { createFollowUp, createPatient, getFollowUps } from "../services/api";

const countPatients = (items, field, value) =>
  items.filter((patient) => patient[field] === value).length;

function Worklist() {
  const [patients, setPatients] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("updated-desc");
  const [isModalOpen, setIsModalOpen] = useState(
    Boolean(location.state?.openAddPatient),
  );
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    name: "",
    phone: "",
    email: "",
    dischargeDate: "",
    diagnosis: "",
    riskScore: "",
    riskCategory: "MEDIUM",
    riskFactors: "",
  });
  const [followUpForm, setFollowUpForm] = useState({ patientId: "" });
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isActive = true;

    getFollowUps()
      .then((followUps) => {
        if (isActive) setPatients(followUps);
      })
      .catch((error) => {
        if (isActive)
          setLoadError(error.message || "Unable to load follow-ups.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const totalFollowUps = patients.length;
  const highRiskPatients = countPatients(patients, "riskCategory", "HIGH");
  const pendingPatients = countPatients(patients, "status", "Pending");
  const completedPatients = countPatients(patients, "status", "Completed");

  const visiblePatients = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return patients
      .filter((patient) => status === "All" || patient.status === status)
      .filter((patient) => {
        if (!searchTerm) return true;
        return (
          patient.name.toLowerCase().includes(searchTerm) ||
          patient.id.toLowerCase().includes(searchTerm)
        );
      })
      .sort((first, second) => {
        if (sort === "risk-desc") return second.riskScore - first.riskScore;
        if (sort === "risk-asc") return first.riskScore - second.riskScore;

        const firstUpdated = new Date(first.updatedAt || 0).getTime();
        const secondUpdated = new Date(second.updatedAt || 0).getTime();
        return sort === "updated-asc"
          ? firstUpdated - secondUpdated
          : secondUpdated - firstUpdated;
      });
  }, [patients, search, sort, status]);

  // Lock background scroll while modal is open, and allow Escape to close it
  useEffect(() => {
    if (!isModalOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormError("");
    setForm({
      patientId: "",
      name: "",
      phone: "",
      email: "",
      dischargeDate: "",
      diagnosis: "",
      riskScore: "",
      riskCategory: "MEDIUM",
      riskFactors: "",
    });
  }

  async function handleCreateFollowUp(event) {
    event.preventDefault();
    if (!followUpForm.patientId.trim()) {
      setFormError("Patient ID is required.");
      return;
    }

    try {
      const followUp = await createFollowUp({
        patientId: followUpForm.patientId.trim(),
        status: "Pending",
        nextAction: "Conduct Outreach Call",
      });
      setPatients((current) => [...current, followUp]);
      setIsFollowUpModalOpen(false);
      setFollowUpForm({ patientId: "" });
      setFormError("");
      toast.success("Follow-up created");
    } catch (error) {
      setFormError(error.message || "Unable to create follow-up.");
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    const requiredFields = [
      "patientId",
      "name",
      "phone",
      "email",
      "dischargeDate",
      "diagnosis",
      "riskScore",
      "riskCategory",
    ];
    const missingField = requiredFields.find(
      (field) => !String(form[field]).trim(),
    );
    if (missingField) {
      setFormError(`${missingField} is required.`);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setFormError("Enter a valid email address.");
      return;
    }

    const riskScore = Number(form.riskScore);
    if (!Number.isInteger(riskScore) || riskScore < 0 || riskScore > 100) {
      setFormError("Risk score must be between 0 and 100.");
      return;
    }

    setIsCreating(true);
    try {
      const patient = await createPatient({
        patientId: form.patientId.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        dischargeDate: form.dischargeDate,
        diagnosis: form.diagnosis.trim(),
        riskScore,
        riskCategory: form.riskCategory,
        riskFactors: form.riskFactors
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean),
      });
      closeModal();
      toast.success("Patient created");
      navigate(`/patient/${patient.id}`);
    } catch (error) {
      setFormError(
        error.status === 409
          ? "Patient ID already exists."
          : error.message || "Unable to create patient.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Follow-Up Worklist
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Prioritized queue of patients requiring outreach
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatsCard
            title="Total Follow-Ups"
            value={totalFollowUps}
            icon={ClipboardList}
          />
          <StatsCard
            title="High Risk"
            value={highRiskPatients}
            icon={HeartPulse}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <StatsCard
            title="Pending"
            value={pendingPatients}
            icon={CalendarDays}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <StatsCard
            title="Completed"
            value={completedPatients}
            icon={CircleCheck}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
        </div>

        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <SearchBar value={search} onChange={setSearch} />
            <WorklistFilters
              status={status}
              sort={sort}
              onStatusChange={setStatus}
              onSortChange={setSort}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFollowUpModalOpen(true)}
            className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800 lg:w-auto"
          >
            <Plus size={17} />
            New Follow-Up
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">Loading follow-ups...</p>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : visiblePatients.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ClipboardList size={20} className="text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">
              No matching patients
            </h3>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Try adjusting your search or filters, or add a new follow-up.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <WorklistTable patients={visiblePatients} />
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[1px] sm:items-center sm:px-4 sm:py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-follow-up-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-h-[90vh] sm:rounded-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3
                  id="new-follow-up-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Add Patient
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create a patient record in PostgreSQL.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["patientId", "Patient ID", "text", "e.g. P1005"],
                  ["name", "Full Name", "text", "e.g. Michael Johnson"],
                  ["phone", "Phone", "tel", "(555) 019-2870"],
                  ["email", "Email", "email", "michael@example.com"],
                  ["dischargeDate", "Discharge Date", "date", ""],
                  ["diagnosis", "Diagnosis", "text", "Post-operative recovery"],
                  ["riskScore", "Risk Score", "number", "0-100"],
                ].map(([field, label, type, placeholder]) => (
                  <label
                    key={field}
                    className="text-sm font-medium text-slate-700"
                  >
                    {label}
                    <input
                      required
                      type={type}
                      inputMode={type === "number" ? "numeric" : undefined}
                      value={form[field]}
                      onChange={(event) =>
                        updateForm(field, event.currentTarget.value)
                      }
                      placeholder={placeholder}
                      className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Risk Category
                <select
                  value={form.riskCategory}
                  onChange={(event) =>
                    updateForm("riskCategory", event.currentTarget.value)
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Risk Factors
                <textarea
                  rows="3"
                  value={form.riskFactors}
                  onChange={(event) =>
                    updateForm("riskFactors", event.currentTarget.value)
                  }
                  placeholder="One factor per line"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              {formError && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {formError}
                </p>
              )}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 sm:py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:bg-blue-800 sm:py-2"
                >
                  {isCreating ? "Creating..." : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isFollowUpModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[1px] sm:items-center sm:px-4 sm:py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setIsFollowUpModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  New Follow-Up
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Assign an existing patient to the worklist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFollowUp} noValidate>
              <label className="text-sm font-medium text-slate-700">
                Patient ID
                <input
                  required
                  value={followUpForm.patientId}
                  onChange={(event) => {
                    setFollowUpForm({ patientId: event.currentTarget.value });
                    setFormError("");
                  }}
                  placeholder="e.g. P1001"
                  className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              {formError && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {formError}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Create Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Worklist;
