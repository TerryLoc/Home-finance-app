import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFinance } from "../context/FinanceContext";
import { BUCKETS, formatCurrency, getMonthKey } from "../utils/budgetHelpers";
import { exportTransactionsCsv } from "../utils/csvExport";

/* Styled tooltip */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-slate-700">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-700">{p.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { state: { transactions, settings } } = useFinance();

  const data = useMemo(() => {
    const grouped = {};
    for (const transaction of transactions) {
      if (transaction.type !== "expense") continue;
      const month = getMonthKey(transaction.date);
      if (!grouped[month]) {
        grouped[month] = {
          month,
          fixed: 0,
          investments: 0,
          savings: 0,
          guilt_free: 0,
          total: 0,
        };
      }
      grouped[month][transaction.bucket] += Number(transaction.amount || 0);
      grouped[month].total += Number(transaction.amount || 0);
    }

    return Object.values(grouped).sort((a, b) => (a.month > b.month ? 1 : -1));
  }, [transactions]);

  const latestMonth = data[data.length - 1];
  const averageMonthlySpend =
    data.length > 0
      ? data.reduce((sum, month) => sum + Number(month.total || 0), 0) / data.length
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-header">Reports</h2>
          <p className="page-subtitle">Monthly comparison across all 4 budget buckets.</p>
        </div>
        <button
          onClick={() => exportTransactionsCsv(transactions)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export CSV
        </button>
      </div>

      {data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card bg-white/85">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest Month</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{latestMonth?.month || "N/A"}</p>
          </div>
          <div className="card bg-white/85">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest Spend</p>
            <p className="mt-2 text-lg font-bold text-rose-600">{formatCurrency(latestMonth?.total || 0, settings.currency)}</p>
          </div>
          <div className="card bg-white/85">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg Monthly Spend</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(averageMonthlySpend, settings.currency)}</p>
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <svg className="mb-3 h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="8" width="7" height="13" rx="1" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No expense data to chart yet.</p>
          <p className="mt-1 text-xs text-slate-400">Add some transactions to see your monthly spending breakdown.</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Monthly Spend by Bucket</h3>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#64748b", paddingTop: 12 }} />
                {BUCKETS.map((b) => (
                  <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
