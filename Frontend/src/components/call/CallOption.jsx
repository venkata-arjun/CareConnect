function CallOption({ name, value, label, checked, onChange }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition focus-within:ring-2 focus-within:ring-blue-200 ${
      checked
        ? "border-blue-500 bg-blue-50"
        : "border-slate-200 bg-white hover:border-slate-300"
    }`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-blue-600"
      />
      <span className={`text-sm font-medium ${checked ? "text-blue-800" : "text-slate-700"}`}>
        {label}
      </span>
    </label>
  );
}

export default CallOption;