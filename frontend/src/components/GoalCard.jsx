import { formatCurrency, getBucketMeta, getProjectedGoalDate } from "../utils/budgetHelpers";

export default function GoalCard({ goal, monthlyContribution, onDelete, onEdit, currency }) {
  const progress = Number(goal.targetAmount) > 0
    ? Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
    : 0;
  const done = progress >= 100;
  const bucket = getBucketMeta(goal.bucket);
  const projected = getProjectedGoalDate(goal, monthlyContribution);

  return (
    <div className="card animate-fade-in group">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{goal.name}</h3>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: bucket.color }} />
            <span className="text-xs font-medium text-slate-500">{bucket.label}</span>
          </div>
        </div>
        <span className={`badge flex-shrink-0 ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {done ? "Complete!" : `${progress.toFixed(0)}%`}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%`, backgroundColor: bucket.color }}
        />
      </div>
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>{formatCurrency(goal.currentAmount, currency)}</span>
        <span>{formatCurrency(goal.targetAmount, currency)}</span>
      </div>

      {/* Projected */}
      {!done && (
        <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Est. {projected}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button onClick={() => onEdit(goal)} className="btn-secondary flex-1 text-xs">Edit</button>
        <button onClick={() => onDelete(goal.id)} className="btn-danger flex-1 text-xs">Delete</button>
      </div>
    </div>
  );
}
