import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/transactions", label: "Transactions", icon: TransactionsIcon },
  { to: "/goals", label: "Goals", icon: GoalsIcon },
  { to: "/reports", label: "Reports", icon: ReportsIcon },
];

/* ── Inline SVG icons (no dependency needed) ── */
function DashboardIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function TransactionsIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function GoalsIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function ReportsIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function sidebarClass(isActive) {
  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
    isActive
      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
      : "text-slate-400 hover:bg-slate-800 hover:text-white",
  ].join(" ");
}

function mobileClass(isActive) {
  return [
    "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all",
    isActive
      ? "text-brand-600"
      : "text-slate-400 hover:text-slate-600",
  ].join(" ");
}

export default function NavBar() {
  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/50 bg-slate-900 md:flex">
        <div className="flex items-center gap-3 px-5 pt-6 pb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg shadow-md shadow-brand-600/30">
            💰
          </div>
          <span className="text-base font-bold tracking-tight text-white">Household Finance</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => sidebarClass(isActive)}
            >
              <link.icon className="h-[18px] w-[18px] shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-800 px-5 py-4">
          <p className="text-xs text-slate-500">All data stored locally</p>
        </div>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-lg md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 py-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => mobileClass(isActive)}
            >
              {({ isActive }) => (
                <>
                  <link.icon className={`h-5 w-5 ${isActive ? "text-brand-600" : ""}`} />
                  <span>{link.label}</span>
                  {isActive && <span className="mx-auto mt-0.5 h-0.5 w-4 rounded-full bg-brand-600" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
