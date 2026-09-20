import CallOption from "./CallOption";

const outcomes = [
  "Successfully Contacted",
  "Call Not Answered",
  "Requested Callback",
  "Follow-Up Required",
  "Other",
];

function CallOutcome({ value, onChange }) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold tracking-wide text-slate-500">CALL OUTCOME</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {outcomes.map((outcome) => (
          <CallOption
            key={outcome}
            name="callOutcome"
            value={outcome}
            label={outcome}
            checked={value === outcome}
            onChange={(event) => onChange(event.target.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default CallOutcome;