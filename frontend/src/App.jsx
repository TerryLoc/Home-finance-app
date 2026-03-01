import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useFinance } from "./context/FinanceContext";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Transactions from "./pages/Transactions";
import { BUCKETS } from "./utils/budgetHelpers";

function OnboardingModal() {
  const {
    state: { settings },
    dispatch,
  } = useFinance();
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [currency, setCurrency] = useState(settings.currency || "EUR");

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch({
      type: "INIT_APP",
      payload: {
        monthlyIncome: Number(monthlyIncome),
        currency,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-slate-900">Set up your monthly budget</h2>
        <p className="text-sm text-slate-500">
          Enter your monthly net income to initialize your household tracker.
        </p>
        <input
          type="number"
          min="0"
          step="0.01"
          value={monthlyIncome}
          onChange={(event) => setMonthlyIncome(event.target.value)}
          placeholder="Monthly net income"
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          required
        />
        <select
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
        >
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="USD">USD ($)</option>
        </select>
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

function SettingsPanel() {
  const {
    state: { settings },
    dispatch,
  } = useFinance();

  const updateTarget = (bucketKey, value) => {
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: {
        bucketTargets: {
          [bucketKey]: Number(value || 0),
        },
      },
    });
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
      <input
        type="number"
        min="0"
        step="0.01"
        value={settings.monthlyIncome}
        onChange={(event) =>
          dispatch({
            type: "UPDATE_SETTINGS",
            payload: { monthlyIncome: Number(event.target.value || 0) },
          })
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="Monthly income"
      />
      {BUCKETS.map((bucket) => (
        <input
          key={bucket.key}
          type="number"
          min="0"
          step="0.1"
          value={settings.bucketTargets?.[bucket.key] ?? 0}
          onChange={(event) => updateTarget(bucket.key, event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder={`${bucket.label} %`}
        />
      ))}
    </div>
  );
}

export default function App() {
  const {
    state: { needsOnboarding },
  } = useFinance();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {needsOnboarding ? <OnboardingModal /> : null}

      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <NavBar />

        <main className="w-full p-4 pb-24 md:p-8 md:pb-8">
          <SettingsPanel />

          <div className="mt-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
