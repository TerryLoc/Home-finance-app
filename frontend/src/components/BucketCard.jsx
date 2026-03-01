import { getBucketMeta } from "../utils/budgetHelpers";
import { formatCurrency } from "../utils/budgetHelpers";

const statusClasses = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-rose-500",
};

export default function BucketCard({ bucket, currency }) {
  const meta = getBucketMeta(bucket.key);
  const fill = Math.min(100, Math.max(0, bucket.actualPercent));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {meta.label}
        </h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Target {bucket.targetPercent}%
        </span>
      </div>

      <div className="mb-2 flex items-end justify-between gap-4">
        <p className="text-2xl font-bold text-slate-900">
          {bucket.actualPercent.toFixed(1)}%
        </p>
        <p className="text-sm text-slate-500">
          {formatCurrency(bucket.actualAmount, currency)} spent
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${statusClasses[bucket.status]}`}
          style={{ width: `${fill}%`, backgroundColor: meta.color }}
        />
      </div>
    </div>
  );
}
