"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Mess Login", hideWhenLoggedIn: true },
  { href: "/dashboard", label: "Dashboard", showWhenLoggedIn: true },
  { href: "/mess-bill", label: "Mess Bill" },
  { href: "/notifications", label: "Notifications" },
  { href: "/rules", label: "Rules" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-transparent border-none shadow-none focus:outline-none"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 bg-white/80 z-30 md:hidden" onClick={() => setOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] w-4/5 max-w-xs md:w-56 bg-white border-r border-gray-200 flex flex-col justify-between z-40 transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0`}
      >
        <div className="flex-1 flex flex-col gap-1 mt-4 px-2 overflow-y-auto">
          {navLinks.map(link => {
            if (link.hideWhenLoggedIn && isLoggedIn) return null;
            if (link.showWhenLoggedIn && !isLoggedIn) return null;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-3 py-2 font-medium transition-colors text-gray-700 hover:bg-indigo-200 hover:text-indigo-900 focus:bg-indigo-300 focus:text-indigo-900 active:bg-indigo-300 active:text-indigo-900 ${pathname === link.href ? "bg-indigo-100 text-indigo-700" : ""}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="w-full flex flex-col items-center pb-2">
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="w-full rounded-lg px-3 py-2 font-medium text-red-600 hover:bg-red-100 hover:text-red-700 focus:bg-red-200 focus:text-red-800 transition-colors text-left mb-4 shadow-sm border border-red-200"
              style={{ outline: "none" }}
            >
              Logout
            </button>
          )}
          <div className="w-full text-[12px] bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-tight text-left px-2 select-none pt-2">
            Made by Sabari &amp; Roomies 2.0
          </div>
        </div>
      </aside>
    </>
  );
} 