"use client";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Mess Login", hideWhenLoggedIn: true },
  { href: "/dashboard", label: "Dashboard", showWhenLoggedIn: true },
  { href: "/mess-bill", label: "Mess Bill" },
  { href: "/rules", label: "Rules" },
  { href: "/notifications", label: "Notifications" },
  
];

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, loading, logout } = useAuth();

  // Removed empty useEffect

  if (loading) return null; // Simplified loading state check

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* Overlay and Close button for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-white/80 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] w-4/5 max-w-xs md:w-56 bg-white border-r border-gray-200 flex flex-col justify-between z-40 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex-1 flex flex-col gap-2 mt-6 px-3 overflow-y-auto">
          {navLinks.map((link, idx) => {
            if (link.hideWhenLoggedIn && isLoggedIn) return null;
            if (link.showWhenLoggedIn && !isLoggedIn) return null;
            return (
              <Fragment key={link.href}>
              <Link
                href={link.href}
                  className={`rounded-lg px-4 py-3 font-medium text-base transition-colors text-gray-700 hover:bg-indigo-100 hover:text-indigo-900 focus:bg-indigo-200 focus:text-indigo-900 active:bg-indigo-200 active:text-indigo-900 flex items-center ${pathname === link.href ? "bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-400" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {link.label}
              </Link>
                {/* Divider after each link except last */}
                {idx < navLinks.length - 1 && <div className="h-px bg-gray-100 my-1 mx-2" />}
              </Fragment>
            );
          })}
        </div>
        <div className="w-full flex flex-col items-center pb-3 pt-2 border-t border-gray-100 bg-white/90">
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="w-11/12 rounded-lg px-4 py-2 font-medium text-red-600 hover:bg-red-100 hover:text-red-700 focus:bg-red-200 focus:text-red-800 transition-colors text-left mb-3 shadow-sm border border-red-200 text-base"
              style={{ outline: "none" }}
            >
              Logout
            </button>
          )}
          <div className="w-full text-xs leading-tight text-center px-2 select-none pt-1 text-gray-500">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-pink-500 font-semibold">Made by </span>
            <span className="text-black font-semibold">Sabari</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-pink-500 font-semibold"> &amp; </span>
            <span className="text-black font-semibold">Roomies 2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
} 