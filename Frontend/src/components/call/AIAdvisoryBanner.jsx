import { Info } from "lucide-react";

function AIAdvisoryBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <Info aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-blue-600" />
      <p>Automated review is advisory. Please confirm details before continuing.</p>
    </div>
  );
}

export default AIAdvisoryBanner;