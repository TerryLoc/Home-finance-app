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

  useEffect(() => {
    if (editingTransaction) {
      setForm({ ...editingTransaction, amount: String(editingTransaction.amount) });
    }
  }, [editingTransaction]);

  const submitLabel = useMemo(() => (editingTransaction ? "Update" : "Add"), [editingTransaction]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "description") {
      setForm((prev) => ({
        ...prev,
        description: value,
        bucket: tagBucketFromDescription(value),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      amount: Number(form.amount),
    };

    onSubmit(payload);

    if (!editingTransaction) {
      setForm(initial);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2"
    >
      <input
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        required
      />
      <input
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        type="number"
        min="0"
        step="0.01"
        name="amount"
        placeholder="Amount"
        value={form.amount}
        onChange={handleChange}
        required
      />
      <input
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
        type="text"
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        required
      />
      <input
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        type="text"
        name="category"
        placeholder="Category"
        value={form.category}
        onChange={handleChange}
        required
      />
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        name="bucket"
        value={form.bucket}
        onChange={handleChange}
      >
        {BUCKETS.map((bucket) => (
          <option key={bucket.key} value={bucket.key}>
            {bucket.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        name="type"
        value={form.type}
        onChange={handleChange}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>

      <div className="flex gap-2 md:col-span-2">
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
          {submitLabel} Transaction
        </button>
        {editingTransaction ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
