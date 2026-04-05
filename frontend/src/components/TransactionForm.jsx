import { useEffect, useMemo, useState } from "react";
import { BUCKETS, tagBucketFromDescription } from "../utils/budgetHelpers";

const initial = {
  date: new Date().toISOString().slice(0, 10),
  amount: "",
  description: "",
  category: "",
  bucket: "guilt_free",
  type: "expense",
};

export default function TransactionForm({ onSubmit, editingTransaction, onCancelEdit }) {
  const [form, setForm] = useState(initial);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setForm({ ...editingTransaction, amount: String(editingTransaction.amount) });
      setOpen(true);
    }
  }, [editingTransaction]);

  const isEditing = !!editingTransaction;
  const submitLabel = useMemo(() => (isEditing ? "Update" : "Add"), [isEditing]);
  const canSubmit = useMemo(() => {
    return (
      Number(form.amount) > 0
      && form.description.trim().length > 1
      && form.category.trim().length > 1
      && !!form.date
    );
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "description") {
      setForm((p) => ({
        ...p,
        description: value,
        bucket: p.type === "expense" ? tagBucketFromDescription(value) : p.bucket,
      }));
      return;
    }

    if (name === "type" && value === "income") {
      setForm((p) => ({ ...p, type: value, bucket: "guilt_free" }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      ...form,
      amount: Number(form.amount),
      description: form.description.trim(),
      category: form.category.trim(),
    });
    if (!isEditing) { setForm(initial); setOpen(false); }
  };

  if (!open && !isEditing) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 self-start">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        New Transaction
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{isEditing ? "Edit Transaction" : "New Transaction"}</h3>
        {!isEditing && (
          <button type="button" onClick={() => setOpen(false)} className="text-slate-400 transition hover:text-slate-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
          <input className="input-field" type="date" name="date" value={form.date} onChange={handleChange} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Amount</label>
          <input className="input-field" type="number" min="0" step="0.01" name="amount" placeholder="0.00" value={form.amount} onChange={handleChange} required />
        </div>
        <div className="sm:col-span-2 xl:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
          <select className="input-field" name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="sm:col-span-2 xl:col-span-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
          <input className="input-field" type="text" name="description" placeholder="e.g. Grocery shopping" value={form.description} onChange={handleChange} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
          <input className="input-field" type="text" name="category" placeholder="e.g. Food" value={form.category} onChange={handleChange} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Bucket</label>
          <select className="input-field" name="bucket" value={form.bucket} onChange={handleChange}>
            {BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button type="submit" className="btn-primary" disabled={!canSubmit}>{submitLabel} Transaction</button>
        {isEditing && <button type="button" onClick={onCancelEdit} className="btn-secondary">Cancel</button>}
      </div>
    </form>
  );
}
