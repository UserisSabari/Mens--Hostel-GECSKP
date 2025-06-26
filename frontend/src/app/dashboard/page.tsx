"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { useAuth } from "../../context/AuthContext";
import Link from 'next/link';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { monthNames } from "@/constants/months";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function useCurrentUser() {
  const [user, setUser] = useState<{ name: string; email: string; role: string; userId: string } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUser({
        name: decoded.name || "",
        email: decoded.email || "",
        role: decoded.role || "student",
        userId: decoded.userId || "",
      });
    } catch {
      setUser(null);
    }
  }, []);
  return user;
}

// Attendance marking window config
const ATTENDANCE_WINDOW_DAYS = parseInt(process.env.NEXT_PUBLIC_ATTENDANCE_WINDOW_DAYS || "7", 10);
const ATTENDANCE_DEADLINE_HOUR = parseInt(process.env.NEXT_PUBLIC_ATTENDANCE_DEADLINE_HOUR || "19", 10);

export default function DashboardPage() {
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
  const [userCount, setUserCount] = useState<number | null>(null);

  const user = useCurrentUser();

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
    // Add generated date in the left corner
    const generatedDate = new Date().toLocaleString();
    const userName = user?.name || '';
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedDate} | Name: ${userName}`, 10, 10);
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
        morning: meals.morning ? { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } } : { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } },
        noon: meals.noon ? { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } } : { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } },
        night: meals.night ? { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } } : { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } },
      };
    });
    autoTable(doc, {
      startY: 18,
      columns,
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241] },
      didParseCell: function (data) {
        const raw = data.cell.raw as any;
        if (raw && typeof raw === 'object' && raw.styles) {
          data.cell.styles.textColor = raw.styles.textColor;
          data.cell.text = raw.text;
        }
      },
    });
    const monthName = monthNames[month];
    doc.save(`attendance-details-${monthName}-${year}.pdf`);
  };

  // Add export summary to PDF
  const exportSummaryToPDF = () => {
    if (!summary || !date) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Mess Cut Summary", 14, 18);
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 14, 30);
    doc.text(`Morning: ${summary.morning}`, 14, 40);
    doc.text(`Noon: ${summary.noon}`, 14, 50);
    doc.text(`Night: ${summary.night}`, 14, 60);
    // Add table of details
    if (details && details.length > 0) {
      const columns = [
        { header: "Sl No", dataKey: "slno" },
        { header: "Name", dataKey: "name" },
        { header: "Morning", dataKey: "morning" },
        { header: "Noon", dataKey: "noon" },
        { header: "Night", dataKey: "night" },
      ];
      const rows = details.map((d, i) => ({
        slno: i + 1,
        name: d.name,
        morning: d.morning ? { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } } : { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } },
        noon: d.noon ? { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } } : { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } },
        night: d.night ? { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } } : { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } },
      }));
      autoTable(doc, {
        startY: 70,
        columns,
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [99, 102, 241] },
        didParseCell: function (data) {
          const raw = data.cell.raw as any;
          if (raw && typeof raw === 'object' && raw.styles) {
            data.cell.styles.textColor = raw.styles.textColor;
            data.cell.text = raw.text;
          }
        },
      });
    }
    doc.save(`mess-cut-summary-${date}.pdf`);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      const fetchUserCount = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:5000/api/auth/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch user count");
          const data = await res.json();
          setUserCount(data.users.length);
        } catch {
          setUserCount(null);
        }
      };
      fetchUserCount();
    }
  }, [user]);

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
          {userCount !== null && (
            <div className="w-full text-lg font-semibold text-indigo-700 mb-2 text-left">Total Students: {userCount}</div>
          )}
          <div className="flex gap-4 mb-4 w-full">
            <Link href="/dashboard/create-user">
              <button className="bg-indigo-500 text-white px-4 py-2 rounded shadow hover:bg-indigo-600 transition-colors">
                Create New User
              </button>
            </Link>
            {/* Hide or explain Add Notification button */}
            {/* <button className="bg-pink-500 text-white px-4 py-2 rounded shadow hover:bg-pink-600 transition-colors" disabled>
              Add Notification
            </button> */}
            <button
              className="bg-pink-500 text-white px-4 py-2 rounded shadow hover:bg-pink-600 transition-colors relative group"
              disabled
            >
              Add Notification
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">Coming soon</span>
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
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-indigo-700">Summary of Mess Cuts</h2>
                <button
                  className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition-colors text-sm"
                  onClick={exportSummaryToPDF}
                >
                  Export to PDF
                </button>
              </div>
              <div className="text-gray-700 mb-2">Selected Date: <span className="font-semibold">{date}</span></div>
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
                      <td className={`px-3 py-2 text-center font-bold ${d.morning ? 'text-red-600' : 'text-green-600'}`}>{d.morning ? 'No' : 'Yes'}</td>
                      <td className={`px-3 py-2 text-center font-bold ${d.noon ? 'text-red-600' : 'text-green-600'}`}>{d.noon ? 'No' : 'Yes'}</td>
                      <td className={`px-3 py-2 text-center font-bold ${d.night ? 'text-red-600' : 'text-green-600'}`}>{d.night ? 'No' : 'Yes'}</td>
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
  const userId = user?.userId || "";

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
                          <td className={`px-3 py-2 text-center font-bold ${meals.morning ? 'text-green-600' : 'text-red-600'}`}>{meals.morning ? 'Yes' : 'No'}</td>
                          <td className={`px-3 py-2 text-center font-bold ${meals.noon ? 'text-green-600' : 'text-red-600'}`}>{meals.noon ? 'Yes' : 'No'}</td>
                          <td className={`px-3 py-2 text-center font-bold ${meals.night ? 'text-green-600' : 'text-red-600'}`}>{meals.night ? 'Yes' : 'No'}</td>
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