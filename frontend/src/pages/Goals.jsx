import { useMemo, useState } from "react";
import GoalCard from "../components/GoalCard";
import { useFinance } from "../context/FinanceContext";
import { BUCKETS } from "../utils/budgetHelpers";

const blankGoal = {
  name: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  bucket: "savings",
};

export default function Goals() {
  const {
    state: { goals, settings },
    dispatch,
  } = useFinance();

  const [form, setForm] = useState(blankGoal);
  const [editingGoal, setEditingGoal] = useState(null);

  const monthlyContributionsByBucket = useMemo(() => {
    const income = Number(settings.monthlyIncome || 0);
    const totals = {};
    BUCKETS.forEach((bucket) => {
      totals[bucket.key] = (income * Number(settings.bucketTargets?.[bucket.key] || 0)) / 100;
    });
    return totals;
  }, [settings.monthlyIncome, settings.bucketTargets]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
    };

    if (editingGoal) {
      dispatch({ type: "UPDATE_GOAL", payload: { ...editingGoal, ...payload, id: editingGoal.id } });
      setEditingGoal(null);
    } else {
      dispatch({ type: "ADD_GOAL", payload });
    }

    setForm(blankGoal);
  };

  const startEdit = (goal) => {
    setEditingGoal(goal);
    setForm({
      ...goal,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Goals</h2>
        <p className="text-sm text-slate-500">Track your savings and long-term targets.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Goal name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={form.bucket}
          onChange={(event) => setForm((prev) => ({ ...prev, bucket: event.target.value }))}
        >
          {BUCKETS.map((bucket) => (
            <option key={bucket.key} value={bucket.key}>
              {bucket.label}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          min="0"
          step="0.01"
          placeholder="Target amount"
          value={form.targetAmount}
          onChange={(event) => setForm((prev) => ({ ...prev, targetAmount: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="number"
          min="0"
          step="0.01"
          placeholder="Current amount"
          value={form.currentAmount}
          onChange={(event) => setForm((prev) => ({ ...prev, currentAmount: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          type="date"
          value={form.targetDate}
          onChange={(event) => setForm((prev) => ({ ...prev, targetDate: event.target.value }))}
        />

        <div className="flex gap-2 md:col-span-2">
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
            {editingGoal ? "Update Goal" : "Add Goal"}
          </button>
          {editingGoal ? (
            <button
              type="button"
              onClick={() => {
                setEditingGoal(null);
                setForm(blankGoal);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            monthlyContribution={monthlyContributionsByBucket[goal.bucket] || 0}
            currency={settings.currency}
            onEdit={startEdit}
            onDelete={(goalId) => dispatch({ type: "DELETE_GOAL", payload: goalId })}
          />
        ))}
      </div>
    </div>
  );
}
