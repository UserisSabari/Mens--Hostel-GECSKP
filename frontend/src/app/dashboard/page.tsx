"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { useAuth } from "../../context/AuthContext";
import Link from 'next/link';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [monthDetails, setMonthDetails] = useState<any[]>([]);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);

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

  const exportTableToPDF = () => {
    const doc = new jsPDF();
    // Table columns
    const columns = [
      { header: "Date", dataKey: "date" },
      { header: "Morning", dataKey: "morning" },
      { header: "Noon", dataKey: "noon" },
      { header: "Night", dataKey: "night" },
    ];
    // Table rows
    const year = calendarYear ?? new Date().getFullYear();
    const month = (calendarMonth ?? new Date().getMonth()); // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const allDates = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    });
    const rows = allDates.map(dateStr => {
      const record = monthDetails.find(d => d.date === dateStr);
      const meals = record ? record.meals : { morning: true, noon: true, night: true };
      return {
        date: dateStr,
        morning: meals.morning ? "Yes" : "No",
        noon: meals.noon ? "Yes" : "No",
        night: meals.night ? "Yes" : "No",
      };
    });
    autoTable(doc, { columns, body: rows });
    const monthNames = [
      "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[month];
    doc.save(`attendance-details-${monthName}.pdf`);
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
      <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-0 sm:p-6 mt-2">
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
  let userId = "";
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        userId = JSON.parse(atob(token.split(".")[1])).userId;
      } catch {
        userId = "";
      }
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-0 sm:p-6 mt-2">
      {/* User Info Container */}
      <div className="w-full max-w-4xl flex flex-col gap-0 items-center justify-start bg-white/90 rounded-2xl shadow-xl p-4 sm:p-8 mt-2 sm:mt-4 border border-gray-100 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0 w-full text-left">Welcome, {user.name}!</h1>
        <span className="text-base text-indigo-600 font-medium w-full text-left mt-0">{user.role}</span>
      </div>
      {/* Calendar/Table Section */}
      <div className="w-full max-w-3xl mx-auto">
        {showCalendar ? (
          <>
            <AttendanceCalendar
              onMonthChange={(year: number, month: number) => {
                setCalendarYear(year);
                setCalendarMonth(month);
              }}
            />
            <div className="flex flex-col items-center mt-4">
              <button
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors font-semibold text-lg"
                onClick={async () => {
                  setDetailsLoading(true);
                  setDetailsError(null);
                  setMonthDetails([]);
                  try {
                    const token = localStorage.getItem("token");
                    const year = calendarYear ?? new Date().getFullYear();
                    const month = (calendarMonth ?? new Date().getMonth()) + 1;
                    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
                    const res = await fetch(`http://localhost:5000/api/attendance/month?userId=${userId}&month=${monthStr}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error("Failed to fetch details");
                    const data = await res.json();
                    setMonthDetails(data.attendance || []);
                    setShowCalendar(false); // Hide calendar, show table
                  } catch (err: any) {
                    setDetailsError(err.message || "Unknown error");
                  } finally {
                    setDetailsLoading(false);
                  }
                }}
                disabled={detailsLoading}
              >
                {detailsLoading ? "Loading..." : "Get My Details"}
              </button>
              {detailsError && <div className="text-red-600 font-medium mt-2">{detailsError}</div>}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center mt-4">
            <div className="flex gap-2 mb-4">
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                onClick={() => setShowCalendar(true)}
              >
                Back to Calendar
              </button>
              <button
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
                onClick={exportTableToPDF}
              >
                Export to PDF
              </button>
            </div>
            <div className="w-full mt-0 overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-3 py-2 text-indigo-700">Date</th>
                    <th className="px-3 py-2 text-indigo-700">Morning</th>
                    <th className="px-3 py-2 text-indigo-700">Noon</th>
                    <th className="px-3 py-2 text-indigo-700">Night</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Generate all days in the selected month
                    const year = calendarYear ?? new Date().getFullYear();
                    const month = (calendarMonth ?? new Date().getMonth()); // 0-indexed
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const allDates = Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    });
                    return allDates.map((dateStr, i) => {
                      const record = monthDetails.find(d => d.date === dateStr);
                      const meals = record ? record.meals : { morning: true, noon: true, night: true };
                      return (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 text-black text-center">{dateStr}</td>
                          <td className="px-3 py-2 text-center text-black">{meals.morning ? "✔️" : "❌"}</td>
                          <td className="px-3 py-2 text-center text-black">{meals.noon ? "✔️" : "❌"}</td>
                          <td className="px-3 py-2 text-center text-black">{meals.night ? "✔️" : "❌"}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 