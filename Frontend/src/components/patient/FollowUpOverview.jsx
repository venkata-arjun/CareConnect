import { CalendarClock, ClipboardList, History } from "lucide-react";

import { formatDateTime } from "../../services/api";

function FollowUpItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
        <Icon aria-hidden="true" size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function FollowUpOverview({ patient }) {
  const nextFollowUp = patient.followUps?.find(
    (followUp) => followUp.status === "Pending" && followUp.scheduledAt,
  );
  const details = [
    {
      label: "Previous follow-up",
      value: patient.previousFollowUp || "Not available",
      icon: History,
    },
    {
      label: "Last contact",
      value: patient.lastContact || "Not available",
      icon: CalendarClock,
    },
    {
      label: "Next action",
      value: patient.nextAction || "Not available",
      icon: ClipboardList,
    },
    {
      label: "Next follow-up",
      value: nextFollowUp
        ? formatDateTime(nextFollowUp.scheduledAt)
        : "Not needed",
      icon: CalendarClock,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900">Follow-up plan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Recent outreach context and the next required step.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {details.map((detail) => (
          <FollowUpItem key={detail.label} {...detail} />
        ))}
      </div>
    </section>
  );
}

export default FollowUpOverview;
