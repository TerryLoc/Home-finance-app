import { useMemo, useState } from "react";
import TransactionForm from "../components/TransactionForm";
import { useFinance } from "../context/FinanceContext";
import { BUCKETS, formatCurrency, getMonthKey } from "../utils/budgetHelpers";

export default function Transactions() {
  const {
    state: { transactions, settings },
    dispatch,
  } = useFinance();

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [bucketFilter, setBucketFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(getMonthKey());

  const filtered = useMemo(() => {
    return transactions
      .filter((transaction) => bucketFilter === "all" || transaction.bucket === bucketFilter)
      .filter((transaction) => !monthFilter || getMonthKey(transaction.date) === monthFilter)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, bucketFilter, monthFilter]);

  const handleSubmit = (payload) => {
    if (editingTransaction) {
      dispatch({
        type: "UPDATE_TRANSACTION",
        payload: { ...editingTransaction, ...payload, id: editingTransaction.id },
      });
      setEditingTransaction(null);
      return;
    }

    dispatch({ type: "ADD_TRANSACTION", payload });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
        <p className="text-sm text-slate-500">Track, filter, and manage household spending.</p>
      </div>

      <TransactionForm
        onSubmit={handleSubmit}
        editingTransaction={editingTransaction}
        onCancelEdit={() => setEditingTransaction(null)}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={bucketFilter}
          onChange={(event) => setBucketFilter(event.target.value)}
        >
          <option value="all">All buckets</option>
          {BUCKETS.map((bucket) => (
            <option key={bucket.key} value={bucket.key}>
              {bucket.label}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Bucket</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-4 py-3">{transaction.date}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{transaction.description}</p>
                  <p className="text-xs text-slate-500">{transaction.category}</p>
                </td>
                <td className="px-4 py-3 capitalize">{transaction.bucket.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  {formatCurrency(transaction.amount, settings.currency)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => dispatch({ type: "DELETE_TRANSACTION", payload: transaction.id })}
                      className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  No transactions match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
