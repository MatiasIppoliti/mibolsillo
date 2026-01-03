import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  ChevronRight,
  Wallet,
  Layers,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { logout } from "../../features/auth/authSlice";

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleNavClick = () => {
    setIsOpen(false);
    // Scroll to top when navigating to a new section
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    {
      path: "/transactions",
      label: "Movimientos",
      icon: <ArrowLeftRight size={20} />,
    },
    {
      path: "/accounts",
      label: "Cuentas",
      icon: <Wallet size={20} />,
    },
    {
      path: "/categories",
      label: "Categorías",
      icon: <Layers size={20} />,
    },
  ];

  return (
    <>
      {/* Mobile Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">
                MiBolsillo
              </h1>
              <span className="text-xs text-blue-600 font-medium">v1.0.0</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "bg-gray-50 text-blue-600 font-semibold shadow-sm border border-gray-100"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <ChevronRight
                size={16}
                className={`transition-transform duration-200 ${
                  window.location.pathname === item.path
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"
                }`}
              />
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:text-red-600 hover:border-red-100 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
