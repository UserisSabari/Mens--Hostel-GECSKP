"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { useAuth } from "../../context/AuthContext";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      router.replace("/login");
      return;
    }
    const decoded = parseJwt(token);
    if (!decoded) {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      router.replace("/login");
      return;
    }
    setUser({
      name: decoded.name || "Sabari",
      email: decoded.email || "",
      role: decoded.role || "student",
    });
  }, [isLoggedIn, router, setIsLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  if (!isLoggedIn) {
    return null; // Don't show anything if not logged in
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-0 sm:p-6">
      {/* User Info Container */}
      <div className="w-full max-w-4xl flex flex-col gap-0 items-center justify-start bg-white/90 rounded-2xl shadow-xl p-4 sm:p-8 mt-2 sm:mt-4 border border-gray-100 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0 w-full text-left">Welcome, {user.name}!</h1>
        <span className="text-base text-indigo-600 font-medium w-full text-left mt-0">{user.role}</span>
      </div>
      {/* Calendar Section - no border or card look for grid */}
      <div className="w-full max-w-3xl mx-auto">
        <AttendanceCalendar />
      </div>
    </div>
  );
} 