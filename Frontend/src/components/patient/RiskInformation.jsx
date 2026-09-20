import { AlertTriangle } from "lucide-react";

import RiskBadge from "../common/RiskBadge";

function getRiskTone(category) {
  if (category === "HIGH") {
    return {
      border: "border-red-200",
      background: "bg-red-50",
      icon: "bg-red-100 text-red-600",
      score: "text-red-700",
      bar: "bg-red-600",
      dot: "bg-red-500",
    };
  }

  if (category === "MEDIUM") {
    return {
      border: "border-amber-200",
      background: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      score: "text-amber-700",
      bar: "bg-amber-500",
      dot: "bg-amber-500",
    };
  }

  return {
    border: "border-green-200",
    background: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    score: "text-green-700",
    bar: "bg-green-600",
    dot: "bg-green-500",
  };
}

function RiskInformation({ patient }) {
  const riskScore = Number(patient.riskScore) || 0;
  const scoreWidth = `${Math.min(Math.max(riskScore, 0), 100)}%`;
  const tone = getRiskTone(patient.riskCategory);

  return (
    <section
      className={`rounded-2xl border ${tone.border} ${tone.background} p-5 shadow-sm sm:p-6`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Readmission risk
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Current model assessment.
          </p>
        </div>
        <RiskBadge category={patient.riskCategory} />
      </div>

      <div className="mt-6 flex items-end gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          <AlertTriangle aria-hidden="true" size={21} />
        </div>
        <div>
          <p className={`text-4xl font-bold leading-none ${tone.score}`}>
            {riskScore}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            out of 100
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: scoreWidth }}
        />
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Risk factors
        </p>
        {patient.riskFactors?.length ? (
          <ul className="mt-3 space-y-2.5 text-sm leading-5 text-slate-800">
            {patient.riskFactors.map((factor) => (
              <li key={factor} className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`}
                />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No risk factors recorded.
          </p>
        )}
      </div>
    </section>
  );
}

export default RiskInformation;
