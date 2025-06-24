"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { useAuth } from "../../context/AuthContext";
import Link from 'next/link';

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [date, setDate] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to hydrate
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
  }, [isLoggedIn, loading, router, setIsLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  // --- Admin summary fetch ---
  const handleGetSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    setSummary(null);
    setDetails([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/attendance/admin/summary?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch summary");
      }
      const data = await res.json();
      setSummary(data.summary);
      setDetails(data.details);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Don't show anything if not logged in
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // --- Admin Dashboard ---
  if (user.role === "admin") {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-0 sm:p-6 mt-12">
        <div className="w-full max-w-4xl flex flex-col gap-4 items-center justify-start bg-white/90 rounded-2xl shadow-xl p-4 sm:p-8 mt-2 sm:mt-4 border border-gray-100 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 w-full text-left">Admin Dashboard</h1>
          <div className="flex gap-4 mb-4 w-full">
            <Link href="/dashboard/create-user">
              <button className="bg-indigo-500 text-white px-4 py-2 rounded shadow hover:bg-indigo-600 transition-colors">
                Create New User
              </button>
            </Link>
            <button className="bg-pink-500 text-white px-4 py-2 rounded shadow hover:bg-pink-600 transition-colors" disabled>
              Add Notification
            </button>
          </div>
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center mb-4">
            <label className="font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition-colors"
              onClick={handleGetSummary}
              disabled={!date || loadingSummary}
            >
              {loadingSummary ? "Loading..." : "Get Details"}
            </button>
          </div>
          {error && <div className="text-red-600 font-medium mb-2">{error}</div>}
          {summary && (
            <div className="w-full bg-indigo-50 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-semibold text-indigo-700 mb-2">Summary of Mess Cuts</h2>
              <div className="flex gap-8">
                <div className="text-black">Morning: <span className="font-bold text-black">{summary.morning}</span></div>
                <div className="text-black">Noon: <span className="font-bold text-black">{summary.noon}</span></div>
                <div className="text-black">Night: <span className="font-bold text-black">{summary.night}</span></div>
              </div>
            </div>
          )}
          {details.length > 0 && (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-black">Sl No</th>
                    <th className="px-3 py-2 text-left text-black">Name</th>
                    <th className="px-3 py-2 text-black">Morning</th>
                    <th className="px-3 py-2 text-black">Noon</th>
                    <th className="px-3 py-2 text-black">Night</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-black text-center">{i + 1}</td>
                      <td className="px-3 py-2 text-black">{d.name}</td>
                      <td className="px-3 py-2 text-center text-black">{d.morning ? "❌" : "✔️"}</td>
                      <td className="px-3 py-2 text-center text-black">{d.noon ? "❌" : "✔️"}</td>
                      <td className="px-3 py-2 text-center text-black">{d.night ? "❌" : "✔️"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Student Dashboard ---
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-0 sm:p-6 mt-12">
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