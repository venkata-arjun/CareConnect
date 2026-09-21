import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  PhoneCall,
  PhoneOff,
} from "lucide-react";
import { useEffect, useState } from "react";

import Header from "../components/layout/Header";
import StatsCard from "../components/common/StatsCard";
import { getDashboard } from "../services/api";

function BarChart({ data, colors, label }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div
      role="img"
      aria-label={label}
      className="mt-4 flex h-44 items-end justify-around gap-1.5 border-b border-slate-200 px-1 pb-0 sm:mt-5 sm:h-56 sm:gap-3 sm:px-2"
    >
      {data.map((item, index) => (
        <div
          key={item.label}
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 sm:gap-2"
        >
          <span className="text-xs font-semibold text-slate-700">
            {item.value}
          </span>
          <div
            className="flex h-32 w-full max-w-16 items-end justify-center sm:h-44"
            aria-hidden="true"
          >
            <div
              className={`w-full rounded-t-md transition-[height] duration-300 ${colors[index]}`}
              style={{
                height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 4 : 0)}%`,
              }}
            />
          </div>
          <span className="mb-2 max-w-full truncate text-center text-[10px] font-semibold text-slate-500 sm:mb-3 sm:text-[11px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, data, colors, label }) {
  return (
    <section className="min-h-[260px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:min-h-[330px] sm:p-6">
      <h2 className="text-sm font-bold text-slate-600">{title}</h2>
      <BarChart data={data} colors={colors} label={label} />
    </section>
  );
}

function ActivityMetricCard({ title, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:min-h-[104px] sm:gap-4 sm:p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${iconBg}`}
      >
        <Icon size={19} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
          {title}
        </p>
        <p className="mt-1 text-xl font-bold text-slate-800 sm:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    getDashboard()
      .then((data) => {
        if (isActive) setDashboard(data);
      })
      .catch((requestError) => {
        if (isActive)
          setError(requestError.message || "Unable to load dashboard data.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading || error || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header />
        <main className="mx-auto max-w-[1250px] px-4 py-5 sm:px-6 sm:py-6">
          <section
            className={`rounded-xl border p-10 text-center shadow-sm ${error ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}
          >
            <p
              className={`text-sm ${error ? "text-red-700" : "text-slate-500"}`}
            >
              {error || "Loading dashboard..."}
            </p>
            {error && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Retry
              </button>
            )}
          </section>
        </main>
      </div>
    );
  }

  const {
    metrics: dashboardMetrics,
    riskDistribution: riskData = [],
    coordinatorDistribution: coordinatorData = [],
    completionStatus: completionData = [],
  } = dashboard;

  const formatChartLabel = (prefix, data) =>
    `${prefix}: ${data.map((item) => `${item.label} ${item.value}`).join(", ") || "No data"}`;

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-[1250px] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            Operational Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Program-wide performance across all coordinators
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatsCard
            title="Total Requiring Follow-Up"
            value={dashboardMetrics.totalFollowUps}
            icon={ClipboardList}
          />
          <StatsCard
            title="High-Risk Patients"
            value={dashboardMetrics.highRiskPatients}
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <StatsCard
            title="Pending Follow-Ups"
            value={dashboardMetrics.pendingFollowUps}
            icon={CalendarClock}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <StatsCard
            title="Completed Follow-Ups"
            value={dashboardMetrics.completedFollowUps}
            icon={CheckCircle2}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-3">
          <ActivityMetricCard
            title="Successful Calls"
            value={dashboardMetrics.successfulCalls}
            icon={PhoneCall}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
          <ActivityMetricCard
            title="Unsuccessful Attempts"
            value={dashboardMetrics.unsuccessfulAttempts}
            icon={PhoneOff}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <ActivityMetricCard
            title="Requiring Add. Action"
            value={dashboardMetrics.requiringAdditionalAction}
            icon={ClipboardCheck}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            className="col-span-2 lg:col-span-1"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 xl:grid-cols-3">
          <ChartCard
            title="Follow-Ups by Risk Category"
            data={riskData}
            colors={["bg-red-600", "bg-amber-600", "bg-green-600"]}
            label={formatChartLabel("Follow-ups by risk category", riskData)}
          />
          <ChartCard
            title="Follow-Ups by Coordinator"
            data={coordinatorData}
            colors={["bg-indigo-600", "bg-indigo-600", "bg-indigo-600"]}
            label={formatChartLabel(
              "Follow-ups by coordinator",
              coordinatorData,
            )}
          />
          <ChartCard
            title="Completed vs Pending"
            data={completionData}
            colors={["bg-green-600", "bg-amber-600"]}
            label={formatChartLabel(
              "Completed versus pending follow-ups",
              completionData,
            )}
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
