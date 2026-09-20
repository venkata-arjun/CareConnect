import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Fingerprint,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/layout/Header";
import { getDashboard } from "../services/api";

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CU"
  );
}

function formatRole(role) {
  return (role || "coordinator").replace(/[_-]/g, " ");
}

function DetailCard({ icon: Icon, label, value, tone = "blue" }) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-600"
      : tone === "slate"
        ? "bg-slate-100 text-slate-600"
        : "bg-blue-50 text-blue-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}
        >
          <Icon aria-hidden="true" size={19} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold capitalize leading-5 text-slate-800">
            {value || "Not available"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, tone = "blue" }) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-600"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600"
        : tone === "red"
          ? "bg-red-50 text-red-600"
          : "bg-blue-50 text-blue-600";

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}
        >
          <Icon aria-hidden="true" size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold leading-none text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DistributionBar({ label, value, maxValue, color }) {
  const width =
    maxValue > 0 ? `${Math.max((value / maxValue) * 100, 4)}%` : "0%";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

function WorklistActivity({ dashboard, isLoading, error }) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="h-5 w-40 rounded-md bg-slate-200 motion-safe:animate-pulse" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-20 rounded-xl bg-slate-100 motion-safe:animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error || !dashboard) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">
          Worklist activity
        </h2>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          {error || "Activity data is not available right now."}
        </p>
      </section>
    );
  }

  const { metrics, completionStatus, riskDistribution } = dashboard;
  const maxCompletion = Math.max(
    ...completionStatus.map((item) => item.value),
    1,
  );
  const maxRisk = Math.max(...riskDistribution.map((item) => item.value), 1);
  const riskColors = {
    HIGH: "bg-red-500",
    MEDIUM: "bg-amber-500",
    LOW: "bg-green-500",
  };
  const completionColors = {
    Done: "bg-green-500",
    Pending: "bg-amber-500",
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">
            Worklist activity
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Current follow-up workload and outreach progress.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={ClipboardList}
          label="Total follow-ups"
          value={metrics.totalFollowUps}
        />
        <MetricTile
          icon={CalendarClock}
          label="Pending"
          value={metrics.pendingFollowUps}
          tone="amber"
        />
        <MetricTile
          icon={CheckCircle2}
          label="Completed"
          value={metrics.completedFollowUps}
          tone="green"
        />
        <MetricTile
          icon={HeartPulse}
          label="High risk"
          value={metrics.highRiskPatients}
          tone="red"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Follow-up status
          </p>
          <div className="mt-4 space-y-3">
            {completionStatus.map((item) => (
              <DistributionBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={maxCompletion}
                color={completionColors[item.label] || "bg-blue-500"}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Risk mix
          </p>
          <div className="mt-4 space-y-3">
            {riskDistribution.map((item) => (
              <DistributionBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={maxRisk}
                color={riskColors[item.label] || "bg-blue-500"}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [user] = useState(() => getUser());
  const [dashboard, setDashboard] = useState(null);
  const [isActivityLoading, setIsActivityLoading] = useState(Boolean(user));
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    if (!user) return undefined;

    let isActive = true;
    setIsActivityLoading(true);
    setActivityError("");

    getDashboard()
      .then((data) => {
        if (isActive) setDashboard(data);
      })
      .catch((requestError) => {
        if (isActive)
          setActivityError(
            requestError.message || "Unable to load worklist activity.",
          );
      })
      .finally(() => {
        if (isActive) setIsActivityLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`mb-4 flex items-center gap-1.5 rounded-md px-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 sm:mb-5 ${focusRing}`}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {!user ? (
          <section className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <LockKeyhole size={22} className="text-amber-600" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Profile unavailable
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No authenticated coordinator profile was found for this session.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 ${focusRing}`}
            >
              Return to login
            </button>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100/60 sm:h-20 sm:w-20"
                  >
                    <span className="text-lg font-bold text-blue-700 sm:text-xl">
                      {getInitials(user.name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-600">
                      Coordinator account
                    </p>
                    <h1 className="mt-1 truncate text-2xl font-bold leading-8 text-slate-900 sm:text-3xl sm:leading-9">
                      {user.name || "CareConnect User"}
                    </h1>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {user.email?.toLowerCase() || "No email on file"}
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <BadgeCheck size={15} />
                  Authenticated
                </div>
              </div>
            </section>

            <div className="mt-5 space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Account details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Basic coordinator identity used across CareConnect.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <DetailCard
                    icon={UserRound}
                    label="Full name"
                    value={user.name}
                  />
                  <DetailCard
                    icon={Mail}
                    label="Email"
                    value={user.email?.toLowerCase()}
                  />
                  <DetailCard
                    icon={ShieldCheck}
                    label="Role"
                    value={formatRole(user.role)}
                    tone="green"
                  />
                  <DetailCard
                    icon={Fingerprint}
                    label="Account ID"
                    value={user.id}
                    tone="slate"
                  />
                </div>
              </section>

              <WorklistActivity
                dashboard={dashboard}
                isLoading={isActivityLoading}
                error={activityError}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;
