import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinance } from "../context/FinanceContext";
import { BUCKETS, getMonthKey } from "../utils/budgetHelpers";
import { exportTransactionsCsv } from "../utils/csvExport";

export default function Reports() {
  const {
    state: { transactions },
  } = useFinance();

  const grouped = {};
  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }
    const month = getMonthKey(transaction.date);
    if (!grouped[month]) {
      grouped[month] = {
        month,
        fixed: 0,
        investments: 0,
        savings: 0,
        guilt_free: 0,
      };
    }
    grouped[month][transaction.bucket] += Number(transaction.amount || 0);
  }

  const data = Object.values(grouped).sort((a, b) => (a.month > b.month ? 1 : -1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Monthly comparison across all 4 budget buckets.</p>
        </div>
        <button
          onClick={() => exportTransactionsCsv(transactions)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Export CSV
        </button>
      </div>

      <div className="h-[420px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {BUCKETS.map((bucket) => (
              <Bar key={bucket.key} dataKey={bucket.key} name={bucket.label} fill={bucket.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
