import { UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import RiskBadge from "../common/RiskBadge";
import StatusBadge from "../common/StatusBadge";
import { formatDate, formatDateTime } from "../../services/api";

function PatientRow({ patient }) {
  const navigate = useNavigate();

  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {patient.id}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <span className="text-[10px] font-semibold text-blue-600">
              {patient.initials}
            </span>
          </div>
          <span className="font-medium text-slate-700">{patient.name}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {formatDate(patient.dischargeDate)}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <span
          className={`font-bold ${patient.riskScore >= 80 ? "text-red-600" : "text-slate-700"}`}
        >
          {patient.riskScore}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <RiskBadge category={patient.riskCategory} />
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <StatusBadge status={patient.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {formatDateTime(patient.updatedAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <button
          type="button"
          onClick={() => navigate(`/patient/${patient.id}`)}
          className="flex items-center gap-2 rounded-lg border border-blue-500 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <UserRound size={14} />
          View
        </button>
      </td>
    </tr>
  );
}

export default PatientRow;
