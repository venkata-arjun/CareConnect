import CallOption from "./CallOption";

const actions = [
  "Complete Follow-Up",
  "Schedule Another Follow-Up",
  "Additional Action Required",
];

function NextAction({ value, onChange }) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold tracking-wide text-slate-500">
        NEXT ACTION
      </legend>
      <div className="mt-3 grid gap-3">
        {actions.map((action) => (
          <CallOption
            key={action}
            name="nextAction"
            value={action}
            label={action}
            checked={value === action}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default NextAction;
