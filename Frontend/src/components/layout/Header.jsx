import {
  BarChart3,
  ClipboardList,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import careConnectLogo from "../../assets/care-connect.png";

function getUserInitials() {
  try {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    return (
      user.name
        ?.trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "CU"
    );
  } catch {
    return "CU";
  }
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const profileRef = useRef(null);

  const isWorklist = location.pathname.startsWith("/worklist");
  const isPatients = location.pathname.startsWith("/patients");
  const isDashboard = location.pathname.startsWith("/dashboard");

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.success("Logged out");
    setIsProfileOpen(false);
    setIsMobileNavOpen(false);
    navigate("/");
  }

  // Close profile dropdown on outside click / Escape
  useEffect(() => {
    if (!isProfileOpen) return undefined;

    function handlePointerDown(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsProfileOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  // Lock body scroll + Escape to close while mobile nav is open
  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

  // Close mobile nav automatically if the viewport grows past the sm breakpoint
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 640) setIsMobileNavOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={careConnectLogo}
          alt="CareConnect"
          className="h-10 w-10 shrink-0 object-contain"
        />

        <h1 className="min-w-0 truncate text-sm font-bold text-slate-800">
          <span className="block">CareConnect</span>
          <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
            Post-Discharge Follow-Up
          </span>
        </h1>
      </div>

      <button
        type="button"
        aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isMobileNavOpen}
        onClick={() => setIsMobileNavOpen((open) => !open)}
        className="order-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 sm:hidden"
      >
        {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Navigation */}
      <nav className="order-3 hidden items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:top-1/2 sm:flex sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2">
        <Link
          to="/worklist"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isWorklist
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <ClipboardList size={16} />
          Worklist
        </Link>

        <Link
          to="/patients"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isPatients
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <Users size={16} />
          Patients
        </Link>

        <Link
          to="/dashboard"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isDashboard
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <BarChart3 size={16} />
          Dashboard
        </Link>
      </nav>

      {/* Mobile nav overlay + drawer */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity duration-200 sm:hidden ${
          isMobileNavOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isMobileNavOpen}
        onClick={() => setIsMobileNavOpen(false)}
      />
      <nav
        aria-hidden={!isMobileNavOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white p-5 shadow-2xl transition-transform duration-200 ease-out sm:hidden ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
          <p className="text-sm font-bold text-slate-800">Portal menu</p>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileNavOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <X size={18} />
          </button>
        </div>
        <Link
          to="/worklist"
          onClick={() => setIsMobileNavOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            isWorklist
              ? "bg-blue-50 text-blue-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ClipboardList size={18} />
          Worklist
        </Link>
        <Link
          to="/patients"
          onClick={() => setIsMobileNavOpen(false)}
          className={`mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
            isPatients
              ? "bg-blue-50 text-blue-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users size={18} />
          Patients
        </Link>
        <Link
          to="/dashboard"
          onClick={() => setIsMobileNavOpen(false)}
          className={`mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            isDashboard
              ? "bg-blue-50 text-blue-600"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BarChart3 size={18} />
          Dashboard
        </Link>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <span className="text-sm font-semibold text-blue-600">
                {getUserInitials()}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700">Coordinator</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMobileNavOpen(false);
              navigate("/profile");
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <UserRound size={18} />
            Profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      {/* User */}
      <div
        ref={profileRef}
        className="relative hidden shrink-0 items-center gap-3 sm:flex"
      >
        <button
          type="button"
          aria-label="Profile"
          aria-expanded={isProfileOpen}
          onClick={() => setIsProfileOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        >
          <span className="text-sm font-semibold text-blue-600">
            {getUserInitials()}
          </span>
        </button>

        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-slate-700">Coordinator</p>
        </div>

        {isProfileOpen && (
          <div className="absolute right-0 top-11 z-30 min-w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold text-slate-700">
              Coordinator
            </p>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                navigate("/profile");
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              <UserRound size={14} />
              View Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
