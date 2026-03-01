import { getBucketMeta, formatCurrency } from "../utils/budgetHelpers";

const statusConfig = {
  good: { bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700", icon: "✓" },
  warn: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700", icon: "!" },
  danger: { bg: "bg-rose-50", ring: "ring-rose-200", text: "text-rose-700", icon: "↑" },
};

export default function BucketCard({ bucket, currency }) {
  const meta = getBucketMeta(bucket.key);
  const fill = Math.min(100, Math.max(0, bucket.actualPercent));
  const cfg = statusConfig[bucket.status] || statusConfig.good;

  return (
    <div className="card group animate-fade-in">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full ring-2 ring-offset-1"
            style={{ backgroundColor: meta.color, ["--tw-ring-color"]: `${meta.color}40` }}
          />
          <h3 className="text-sm font-semibold text-slate-700">{meta.label}</h3>
        </div>
        <span className="badge bg-slate-100 text-slate-600">Target {bucket.targetPercent}%</span>
      </div>

      {/* Metric row */}
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {bucket.actualPercent.toFixed(1)}%
          </p>
          <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.icon}</span>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {formatCurrency(bucket.actualAmount, currency)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${fill}%`, backgroundColor: meta.color }}
        />
      </div>

      {/* Subtle status footer */}
      <p className={`mt-2 text-xs font-medium ${cfg.text}`}>
        {bucket.status === "good" ? "On track" : bucket.status === "warn" ? "Approaching limit" : "Over budget"}
      </p>
    </div>
  );
}
