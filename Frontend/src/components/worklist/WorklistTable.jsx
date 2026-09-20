import PatientRow from "./PatientRow";

function WorklistTable({ patients }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              {[
                "PATIENT ID",
                "PATIENT NAME",
                "DISCHARGE DATE",
                "RISK SCORE",
                "RISK CATEGORY",
                "STATUS",
                "LAST UPDATED",
                "ACTION",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-4 text-[11px] font-semibold text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.length > 0 ? (
              patients.map((patient) => (
                <PatientRow
                  key={patient.followUpId || patient.id}
                  patient={patient}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No patients match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorklistTable;
