import {
  formatCurrency,
  getBucketMeta,
  getProjectedGoalDate,
} from "../utils/budgetHelpers";

export default function GoalCard({
  goal,
  monthlyContribution,
  onDelete,
  onEdit,
  currency,
}) {
  const progress =
    Number(goal.targetAmount) > 0
      ? Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
      : 0;

  const bucket = getBucketMeta(goal.bucket);
  const projected = getProjectedGoalDate(goal, monthlyContribution);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{goal.name}</h3>
          <p className="text-sm text-slate-500">{bucket.label}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {progress.toFixed(0)}%
        </span>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full"
          style={{ width: `${progress}%`, backgroundColor: bucket.color }}
        />
      </div>

      <div className="space-y-1 text-sm text-slate-600">
        <p>
          {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
        </p>
        <p>Projected completion: {projected}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(goal)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
