import { CalendarDays, Mail, Phone, Stethoscope } from "lucide-react";

import { formatDate } from "../../services/api";

function DetailItem({ icon: Icon, label, value, isWide = false }) {
  return (
    <div className={isWide ? "sm:col-span-2" : undefined}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex min-w-0 items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
        <Icon
          aria-hidden="true"
          size={17}
          className="mt-0.5 shrink-0 text-slate-400"
        />
        <p className="min-w-0 break-words text-sm font-medium leading-5 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function PatientInfoCard({ patient }) {
  const details = [
    {
      label: "Phone",
      value: patient.phone || "Not available",
      icon: Phone,
    },
    {
      label: "Email",
      value: patient.email || "Not available",
      icon: Mail,
    },
    {
      label: "Discharge date",
      value: formatDate(patient.dischargeDate),
      icon: CalendarDays,
    },
    {
      label: "Primary diagnosis",
      value: patient.diagnosis || "Not available",
      icon: Stethoscope,
      isWide: true,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Contact and clinical details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Core information needed before outreach.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {details.map((detail) => (
          <DetailItem key={detail.label} {...detail} />
        ))}
      </div>
    </section>
  );
}

export default PatientInfoCard;
