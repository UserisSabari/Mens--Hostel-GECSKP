"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function getAllDatesInMonth(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) =>
    new Date(year, month, i + 1)
  );
}

export default function MonthlyReportPage() {
  const router = useRouter();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const allDates = useMemo(() => getAllDatesInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const [selectedDates, setSelectedDates] = useState<Date[]>(allDates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update selectedDates when month/year changes
  React.useEffect(() => {
    setSelectedDates(getAllDatesInMonth(selectedYear, selectedMonth));
  }, [selectedMonth, selectedYear]);

  // Toast auto-hide
  React.useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast, showSuccess]);

  const handleExport = async () => {
    if (selectedDates.length === 0) return;
    setLoading(true);
    setError(null);
    setShowSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const dateStrings = selectedDates.map(d => d.toISOString().slice(0, 10));
      const res = await fetch("http://localhost:5000/api/attendance/admin/monthly-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dates: dateStrings }),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Report endpoint not found. Please ensure the backend is running and the endpoint exists.");
        throw new Error("Failed to generate report. Please check your network or backend server.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mess-cut-report-${dateStrings[0]}_to_${dateStrings[dateStrings.length-1]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to download report");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => setSelectedDates(allDates);
  const handleClearAll = () => setSelectedDates([]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-2 sm:p-4">
      <div className="w-full max-w-md sm:max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-8 border border-gray-200 mt-8 sm:mt-16 relative flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-indigo-700 mb-2">Monthly Mess Cut Report</h1>
        <p className="text-center text-gray-600 mb-4 text-base">Export a detailed mess cut report for any month. Select the month, year, and dates to include in the report. You can deselect holidays or non-mess days.</p>
        <hr className="my-2 border-gray-200" />
        <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6 items-center justify-between w-full">
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <label className="font-medium text-gray-900">Month:</label>
            <select
              className="border rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-200 text-base font-semibold text-indigo-700 w-full sm:w-auto outline-none"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              aria-label="Select month"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i} className={selectedMonth === i ? 'bg-indigo-100 font-bold' : ''}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <label className="font-medium text-gray-900">Year:</label>
            <input
              type="number"
              className="border rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-indigo-200 w-full sm:w-28 text-base font-semibold text-indigo-700 outline-none"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              min={2024}
              max={2028}
              aria-label="Select year"
            />
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        <div className="mb-4 sm:mb-6">
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center sm:text-left">Select Dates for the Report</h2>
            <div className="flex gap-2 justify-center sm:justify-end">
              <button
                className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-semibold text-sm hover:bg-indigo-200 transition-all border border-indigo-200"
                onClick={handleSelectAll}
                type="button"
                aria-label="Select all dates"
                disabled={selectedDates.length === allDates.length}
              >
                Select All
              </button>
              <button
                className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all border border-gray-200"
                onClick={handleClearAll}
                type="button"
                aria-label="Clear all dates"
                disabled={selectedDates.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 shadow-sm bg-gray-50 p-1 sm:p-4 flex flex-col items-center w-full overflow-x-auto">
            <div className="w-full flex justify-center">
              <DayPicker
                mode="multiple"
                selected={selectedDates}
                onSelect={dates => setSelectedDates(dates || [])}
                month={new Date(selectedYear, selectedMonth, 1)}
                fromMonth={new Date(selectedYear, selectedMonth, 1)}
                toMonth={new Date(selectedYear, selectedMonth, allDates.length)}
                showOutsideDays={true}
                className="rounded-lg border-0 w-full max-w-full mx-auto bg-white"
                modifiersClassNames={{
                  selected: "!bg-indigo-100 !text-indigo-900 !border !border-indigo-400 !rounded-lg",
                  today: "!bg-indigo-50 !border-indigo-500 !border-2 !text-indigo-700 !font-bold",
                  disabled: "!text-gray-300",
                }}
                styles={{
                  caption: { color: '#4338ca', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.01em', background: '#fff', textAlign: 'center', textShadow: 'none' },
                  head_row: { background: '#fff' },
                  head_cell: { color: '#6366f1', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.01em', textTransform: 'uppercase', background: '#fff', textShadow: 'none' },
                  cell: { fontSize: '1.08rem', color: '#1e293b', fontWeight: 700, padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s', minWidth: '2.2rem', minHeight: '2.2rem', textAlign: 'center', background: '#fff', textShadow: 'none' },
                }}
                aria-label="Select dates for report"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-2 sm:mt-3 gap-1 sm:gap-2 w-full">
              <div className="text-sm text-gray-700 font-normal">
                Selected: <span className="font-semibold text-indigo-700">{selectedDates.length}</span> {selectedDates.length === 1 ? 'day' : 'days'}
              </div>
              <div className="text-xs text-gray-500">All dates are selected by default. Tap any date to deselect (e.g., holidays).</div>
            </div>
            {selectedDates.length === 0 && (
              <div className="mt-2 text-red-600 font-medium text-sm text-center">Please select at least one date to generate a report.</div>
            )}
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        <button
          className={`bg-indigo-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-200 transition-all font-semibold w-full text-base sm:text-lg flex items-center justify-center gap-2 ${loading ? 'animate-pulse opacity-70 cursor-not-allowed' : ''}`}
          onClick={handleExport}
          disabled={loading || selectedDates.length === 0}
          aria-label="Export Excel Report"
        >
          {loading && <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
          {loading ? "Generating..." : "Export Excel Report"}
        </button>
        {showSuccess && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-base animate-fade-in flex items-center gap-2">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Report downloaded successfully!
          </div>
        )}
        <button
          className="mt-4 sm:mt-6 w-full bg-white text-indigo-700 border border-indigo-100 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-100 text-base font-normal py-2 rounded-lg transition-all"
          onClick={() => router.push('/dashboard')}
          aria-label="Back to Dashboard"
        >
          &larr; Back to Dashboard
        </button>
        {showToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-base animate-fade-in">
            {error}
          </div>
        )}
        <div className="mt-4 text-center text-xs text-gray-400">
          <span className="font-semibold">Note:</span> If you see a "report endpoint not found" error, please ensure your backend server is running at <span className="font-mono text-gray-700">http://localhost:5000</span> and the endpoint <span className="font-mono text-gray-700">/api/attendance/admin/monthly-report</span> exists.
        </div>
      </div>
    </div>
  );
} 