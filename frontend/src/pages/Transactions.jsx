import { useMemo, useState } from "react";
import TransactionForm from "../components/TransactionForm";
import { useFinance } from "../context/FinanceContext";
import { BUCKETS, formatCurrency, getBucketMeta, getMonthKey } from "../utils/budgetHelpers";

export default function Transactions() {
  const { state: { transactions, settings }, dispatch } = useFinance();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [bucketFilter, setBucketFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(getMonthKey());

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => bucketFilter === "all" || t.bucket === bucketFilter)
      .filter((t) => !monthFilter || getMonthKey(t.date) === monthFilter)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, bucketFilter, monthFilter]);

  const handleSubmit = (payload) => {
    if (editingTransaction) {
      dispatch({ type: "UPDATE_TRANSACTION", payload: { ...editingTransaction, ...payload, id: editingTransaction.id } });
      setEditingTransaction(null);
      return;
    }
    dispatch({ type: "ADD_TRANSACTION", payload });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="page-header">Transactions</h2>
        <p className="page-subtitle">Track, filter, and manage household spending.</p>
      </div>

      <TransactionForm
        onSubmit={handleSubmit}
        editingTransaction={editingTransaction}
        onCancelEdit={() => setEditingTransaction(null)}
      />

      {/* Filters */}
      <div className="card grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Bucket</label>
          <select className="input-field" value={bucketFilter} onChange={(e) => setBucketFilter(e.target.value)}>
            <option value="all">All buckets</option>
            {BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
          <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="input-field" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <p className="text-sm font-medium text-slate-500">No transactions match your filters.</p>
            <p className="mt-1 text-xs text-slate-400">Try adjusting the bucket or month filter above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Bucket</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => {
                  const meta = getBucketMeta(t.bucket);
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{t.date}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.category}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span className="text-slate-600">{meta.label}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-slate-900">
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount, settings.currency)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setEditingTransaction(t)} className="btn-secondary text-xs !px-2.5 !py-1">Edit</button>
                          <button onClick={() => dispatch({ type: "DELETE_TRANSACTION", payload: t.id })} className="btn-danger text-xs !px-2.5 !py-1">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5 text-xs text-slate-500">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
