import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Home,
  Menu,
  NotebookPen,
  Users,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../utils/formatters";
import SynergyMark from "./SynergyMark";

const baseNavigation = [
  { to: "/app", label: "Overview", icon: Home, roles: ["super-admin", "admin", "collection-agent"] },
  { to: "/app/clients", label: "Clients", icon: Users, roles: ["super-admin", "admin", "collection-agent"] },
  {
    to: "/app/collections",
    label: "Collections",
    icon: ClipboardList,
    roles: ["super-admin", "admin", "collection-agent"]
  },
  { to: "/app/documents", label: "Documents", icon: FileText, roles: ["super-admin", "admin"] },
  { to: "/app/reports", label: "Reports", icon: BarChart3, roles: ["super-admin", "admin"] },
  { to: "/app/team", label: "Team", icon: NotebookPen, roles: ["super-admin"] }
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = baseNavigation.filter((item) => item.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar__header">
          <SynergyMark />
          <button className="ghost-button mobile-only" type="button" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                className={({ isActive }) => `sidebar__link${isActive ? " active" : ""}`}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div>
            <strong>{user.name}</strong>
            <span>{roleLabel(user.role)}</span>
          </div>
          <button className="secondary-button" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-shell__body">
        <header className="topbar">
          <button className="ghost-button mobile-only" type="button" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div>
            <p className="eyebrow">Synergy Operations</p>
            <h1>Waste paper collection management</h1>
          </div>
          <div className="topbar__meta">
            <span>{roleLabel(user.role)}</span>
          </div>
        </header>

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

