import { Suspense, lazy, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useFinance } from "./context/FinanceContext";
import { BUCKETS } from "./utils/budgetHelpers";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Goals = lazy(() => import("./pages/Goals"));
const Reports = lazy(() => import("./pages/Reports"));

function PageFallback() {
  return (
    <div className="card animate-pulse p-6">
      <div className="mb-4 h-6 w-40 rounded-md bg-slate-200" />
      <div className="mb-2 h-4 w-3/4 rounded-md bg-slate-100" />
      <div className="h-4 w-2/4 rounded-md bg-slate-100" />
    </div>
  );
}

/* ── Collapsible settings panel ── */
function SettingsPanel() {
  const { state: { settings }, dispatch } = useFinance();
  const [open, setOpen] = useState(false);

  const updateTarget = (bucketKey, value) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { bucketTargets: { [bucketKey]: Number(value || 0) } } });
  };

  const totalPct = useMemo(
    () => BUCKETS.reduce((sum, bucket) => sum + Number(settings.bucketTargets?.[bucket.key] ?? 0), 0),
    [settings.bucketTargets],
  );

  return (
    <section className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-gradient-to-r from-brand-50/70 to-emerald-50/60 px-5 py-3 text-left transition-colors hover:from-brand-100/70 hover:to-emerald-100/60"
      >
        <div className="flex items-center gap-3">
          <svg className="h-4 w-4 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="text-sm font-semibold text-slate-800">Budget Settings</span>
        </div>
        <svg className={`h-4 w-4 text-brand-700 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div className="animate-fade-in space-y-4 border-t border-slate-100 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", payload: { currency: e.target.value } })}
                className="input-field"
              >
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Bucket Targets</span>
              <span className={`badge ${totalPct === 100 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {totalPct}% of 100%
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {BUCKETS.map((bucket) => (
                <div key={bucket.key}>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                    {bucket.label}
                  </label>
                  <input
                    type="number" min="0" step="0.5"
                    value={settings.bucketTargets?.[bucket.key] ?? 0}
                    onChange={(e) => updateTarget(bucket.key, e.target.value)}
                    className="input-field"
                    placeholder={`${bucket.min}–${bucket.max}%`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function App() {
  return (
    <div className="app-shell min-h-screen text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.12),transparent_32%),linear-gradient(to_bottom,#f8fafc,#eff6ff)]" />
      <div className="flex min-h-screen">
        <NavBar />

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 md:pb-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <SettingsPanel />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
