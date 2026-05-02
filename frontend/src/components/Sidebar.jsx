import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { LayoutDashboard, Building2, Clock, Plus, LogOut, X } from "lucide-react";

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/masjids", icon: Building2, label: "Masjids" },
    { to: "/waqth-charts", icon: Clock, label: "Waqth Charts" },
  ];

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-[#2B5336] text-white"
        : "text-[#5C6B64] hover:bg-[#EAE6DD] hover:text-[#1E2522]"
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="sidebar-overlay md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar-nav"
        className={`fixed top-0 left-0 h-full w-64 bg-[#FCFBF8] border-r border-[#EAE6DD] z-50 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[#EAE6DD] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E2522]" style={{ fontFamily: 'Work Sans' }}>
              Salah Timer
            </h2>
            <button
              data-testid="sidebar-close-btn"
              className="md:hidden p-1 rounded hover:bg-[#EAE6DD]"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-[#5C6B64]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={navLinkClass}
                onClick={onClose}
                data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-[#EAE6DD] mt-3 space-y-1">
              <NavLink
                to="/masjids/add"
                className={navLinkClass}
                onClick={onClose}
                data-testid="nav-add-masjid"
              >
                <Plus className="w-4 h-4" />
                Add Masjid
              </NavLink>
              <NavLink
                to="/waqth-charts/add"
                className={navLinkClass}
                onClick={onClose}
                data-testid="nav-add-waqth"
              >
                <Plus className="w-4 h-4" />
                Add Waqth Chart
              </NavLink>
            </div>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[#EAE6DD]">
            {user && (
              <div className="flex items-center gap-3 mb-3">
                {user.picture && (
                  <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E2522] truncate">{user.name}</p>
                  <p className="text-xs text-[#5C6B64] truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#B24C41] hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
