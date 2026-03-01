import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import BucketCard from "../components/BucketCard";
import { useFinance } from "../context/FinanceContext";
import {
  calculateBudgetHealthScore,
  calculateBucketBreakdown,
  calculateMonthlySpend,
  formatCurrency,
  getMonthKey,
} from "../utils/budgetHelpers";

export default function Dashboard() {
  const {
    state: { settings, transactions },
  } = useFinance();

  const monthKey = getMonthKey();
  const breakdown = calculateBucketBreakdown({
    transactions,
    monthlyIncome: Number(settings.monthlyIncome || 0),
    bucketTargets: settings.bucketTargets,
    monthKey,
  });

  const healthScore = calculateBudgetHealthScore(breakdown);
  const monthlySpend = calculateMonthlySpend(transactions, monthKey);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Monthly spend: {formatCurrency(monthlySpend, settings.currency)}
        </p>
        <p className="text-sm text-slate-500">Budget health score: {healthScore}/100</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Actual Bucket Split
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="actualAmount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {breakdown.map((bucket) => (
                    <Cell key={bucket.key} fill={bucket.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4">
          {breakdown.map((bucket) => (
            <BucketCard key={bucket.key} bucket={bucket} currency={settings.currency} />
          ))}
        </div>
      </div>
    </div>
  );
}
