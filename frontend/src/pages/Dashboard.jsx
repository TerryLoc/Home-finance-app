import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import BucketCard from "../components/BucketCard";
import { useFinance } from "../context/FinanceContext";
import {
  calculateBudgetHealthScore,
  calculateBucketBreakdown,
  calculateMonthlySpend,
  formatCurrency,
  getMonthKey,
  getMonthlyIncome,
} from "../utils/budgetHelpers";

/* Health score ring — SVG arc that fills based on score */
function HealthRing({ score }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-lg font-bold text-slate-900">{score}</span>
    </div>
  );
}

/* Custom tooltip for donut chart */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-700">{name}</p>
      <p className="text-slate-500">{value.toFixed(2)}</p>
    </div>
  );
}

export default function Dashboard() {
  const { state: { settings, transactions }, dispatch } = useFinance();

  const monthKey = getMonthKey();

  const monthlyIncome = useMemo(
    () => getMonthlyIncome(settings, monthKey),
    [settings, monthKey],
  );

  const breakdown = useMemo(
    () =>
      calculateBucketBreakdown({
        transactions,
        monthlyIncome,
        bucketTargets: settings.bucketTargets,
        monthKey,
      }),
    [transactions, monthlyIncome, settings.bucketTargets, monthKey],
  );

  const healthScore = useMemo(
    () => calculateBudgetHealthScore(breakdown),
    [breakdown],
  );
  const monthlySpend = useMemo(
    () => calculateMonthlySpend(transactions, monthKey),
    [transactions, monthKey],
  );

  const remaining = Math.max(0, monthlyIncome - monthlySpend);
  const topBucket = useMemo(
    () => [...breakdown].sort((a, b) => b.actualPercent - a.actualPercent)[0],
    [breakdown],
  );

  const monthLabel = new Date().toLocaleDateString("en-IE", { month: "long", year: "numeric" });

  const handleIncomeChange = (e) => {
    dispatch({ type: "SET_MONTH_INCOME", payload: { monthKey, amount: e.target.value } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero header */}
      <div className="card flex flex-col items-start justify-between gap-6 bg-gradient-to-r from-white to-brand-50/40 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <h2 className="page-header">Dashboard</h2>
          <p className="page-subtitle">{monthLabel}</p>

          {/* Inline income input */}
          <div className="mt-3 mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Net Income for {monthLabel}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlyIncome || ""}
              onChange={handleIncomeChange}
              placeholder="Enter this month's income…"
              className="input-field max-w-xs"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Monthly Income</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(monthlyIncome, settings.currency)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Spend</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(monthlySpend, settings.currency)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Remaining</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(remaining, settings.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <HealthRing score={healthScore} />
          <span className="text-xs font-semibold text-slate-500">Health Score</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="card bg-white/85">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spend Ratio</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {monthlyIncome > 0 ? `${((monthlySpend / monthlyIncome) * 100).toFixed(1)}%` : "0%"}
          </p>
          <p className="mt-1 text-xs text-slate-500">How much of this month&rsquo;s income is already allocated</p>
        </div>
        <div className="card bg-white/85">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Pressure Bucket</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{topBucket?.label || "N/A"}</p>
          <p className="mt-1 text-xs text-slate-500">Currently at {topBucket ? topBucket.actualPercent.toFixed(1) : "0.0"}%</p>
        </div>
        <div className="card bg-white/85 sm:col-span-2 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coaching Hint</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {healthScore >= 80
              ? "Strong month so far. Keep discretionary spend steady to preserve momentum."
              : "Shift a little spend from non-essential categories to recover toward target."}
          </p>
        </div>
      </div>

      {/* Chart + Bucket cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut chart */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Spending Breakdown</h3>
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
                  strokeWidth={0}
                >
                  {breakdown.map((b) => (
                    <Cell key={b.key} fill={b.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {breakdown.map((b) => (
              <div key={b.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bucket cards */}
        <div className="grid gap-4 content-start">
          {breakdown.map((b) => (
            <BucketCard key={b.key} bucket={b} currency={settings.currency} />
          ))}
        </div>
      </div>
    </div>
  );
}
