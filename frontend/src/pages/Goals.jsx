import { useMemo, useState } from "react";
import GoalCard from "../components/GoalCard";
import { useFinance } from "../context/FinanceContext";
import { BUCKETS, getMonthKey, getMonthlyIncome } from "../utils/budgetHelpers";

const blankGoal = { name: "", targetAmount: "", currentAmount: "", targetDate: "", bucket: "savings" };

export default function Goals() {
  const { state: { goals, settings }, dispatch } = useFinance();
  const [form, setForm] = useState(blankGoal);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const monthlyContributionsByBucket = useMemo(() => {
    const inc = getMonthlyIncome(settings, getMonthKey());
    const out = {};
    BUCKETS.forEach((b) => { out[b.key] = (inc * Number(settings.bucketTargets?.[b.key] || 0)) / 100; });
    return out;
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) };
    if (editingGoal) {
      dispatch({ type: "UPDATE_GOAL", payload: { ...editingGoal, ...payload, id: editingGoal.id } });
      setEditingGoal(null);
    } else {
      dispatch({ type: "ADD_GOAL", payload });
    }
    setForm(blankGoal);
    setShowForm(false);
  };

  const startEdit = (goal) => {
    setEditingGoal(goal);
    setForm({ ...goal, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount) });
    setShowForm(true);
  };

  const isEditing = !!editingGoal;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-header">Goals</h2>
          <p className="page-subtitle">Track your savings and long-term targets.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Goal
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{isEditing ? "Edit Goal" : "New Goal"}</h3>
            {!isEditing && (
              <button type="button" onClick={() => { setShowForm(false); setForm(blankGoal); }} className="text-slate-400 transition hover:text-slate-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Goal Name</label>
              <input className="input-field" placeholder="e.g. Emergency fund" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Bucket</label>
              <select className="input-field" value={form.bucket} onChange={(e) => setForm((p) => ({ ...p, bucket: e.target.value }))}>
                {BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Target Date</label>
              <input className="input-field" type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Target Amount</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00" value={form.targetAmount} onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Saved So Far</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00" value={form.currentAmount} onChange={(e) => setForm((p) => ({ ...p, currentAmount: e.target.value }))} required />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" className="btn-primary">{isEditing ? "Update Goal" : "Add Goal"}</button>
            {isEditing && (
              <button type="button" onClick={() => { setEditingGoal(null); setForm(blankGoal); setShowForm(false); }} className="btn-secondary">Cancel</button>
            )}
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <svg className="mb-3 h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No goals yet.</p>
          <p className="mt-1 text-xs text-slate-400">Add your first financial goal to start tracking progress.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              monthlyContribution={monthlyContributionsByBucket[goal.bucket] || 0}
              currency={settings.currency}
              onEdit={startEdit}
              onDelete={(id) => dispatch({ type: "DELETE_GOAL", payload: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
