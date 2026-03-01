import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/goals", label: "Goals" },
  { to: "/reports", label: "Reports" },
];

function linkClass(isActive) {
  return isActive
    ? "rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
    : "rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100";
}

export default function NavBar() {
  return (
    <>
      <aside className="hidden w-64 border-r border-slate-200 bg-white p-4 md:block">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Household Finance</h1>
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => linkClass(isActive)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-2 md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => linkClass(isActive)}>
              <span className="block text-center text-xs">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
