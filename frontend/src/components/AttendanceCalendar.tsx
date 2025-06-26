"use client";
import React from 'react';
import { useEffect, useState } from "react";

// Helper to get days in month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get weekday (0=Sun, 1=Mon, ...)
function getWeekday(year: number, month: number, day: number) {
  return new Date(year, month, day).getDay();
}

// Types
interface Attendance {
  date: string; // YYYY-MM-DD
  meals: { morning: boolean; noon: boolean; night: boolean };
}

// Add prop type
interface AttendanceCalendarProps {
  onMonthChange?: (year: number, month: number) => void;
}

const ATTENDANCE_WINDOW_DAYS = parseInt(process.env.NEXT_PUBLIC_ATTENDANCE_WINDOW_DAYS || "7", 10);
const ATTENDANCE_DEADLINE_HOUR = parseInt(process.env.NEXT_PUBLIC_ATTENDANCE_DEADLINE_HOUR || "19", 10);

export default function AttendanceCalendar({ onMonthChange }: AttendanceCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalMeals, setModalMeals] = useState({ morning: true, noon: true, night: true });
  const [loading, setLoading] = useState(false);
  let token: string | null = null;
  let userId = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
    if (token) {
      try {
        userId = JSON.parse(atob(token.split(".")[1])).userId;
      } catch {
        userId = "";
      }
    }
  }

  // If not logged in, render nothing (or a message)
  if (!userId) {
    return null;
  }

  // Calculate month navigation limits
  const current = new Date();
  const minMonth = new Date(current.getFullYear(), current.getMonth() - 2, 1);
  const maxMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  const viewing = new Date(year, month, 1);
  const isPrevDisabled = viewing <= minMonth;
  const isNextDisabled = viewing >= maxMonth;

  // Fetch attendance for the month (do not fetch for future months)
  useEffect(() => {
    if (onMonthChange) onMonthChange(year, month);
    const fetchAttendance = async () => {
      setLoading(true);
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
      // Only fetch if not in the future
      const now = new Date();
      if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth())) {
        setAttendance([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`http://localhost:5000/api/attendance/month?userId=${userId}&month=${monthStr}`);
      const data = await res.json();
      setAttendance(data.attendance || []);
      setLoading(false);
    };
    if (userId) fetchAttendance();
  }, [year, month, userId]);

  // Open modal to mark attendance
  const openModal = (date: string) => {
    const record = attendance.find(a => a.date === date);
    setModalMeals(record ? record.meals : { morning: true, noon: true, night: true });
    setSelectedDate(date);
  };

  // Handle marking attendance
  const handleMark = async () => {
    setLoading(true);
    await fetch("http://localhost:5000/api/attendance/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, date: selectedDate, meals: modalMeals }),
    });
    setSelectedDate(null);
    // Refresh attendance
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const res = await fetch(`http://localhost:5000/api/attendance/month?userId=${userId}&month=${monthStr}`);
    const data = await res.json();
    setAttendance(data.attendance || []);
    setLoading(false);
  };

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getWeekday(year, month, 1);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get attendance status for a day
  const getStatus = (date: string) => {
    const record = attendance.find(a => a.date === date);
    if (!record) return "unmarked";
    const { morning, noon, night } = record.meals;
    if (!morning && !noon && !night) return "messcut";
    if (morning && noon && night) return "full";
    return "partial";
  };

  // UI color mapping (no green for full)
  const statusStyles: Record<string, string> = {
    partial: "bg-yellow-300 border-yellow-400 text-yellow-800",
    messcut: "bg-gray-400 border-gray-500 text-white",
    unmarked: "bg-white border-gray-300 text-gray-800",
    disabled: "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed",
  };

  const isMarkable = (dateStr: string) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = dateStr.split("-").map(Number);
    const dayDate = new Date(y, m - 1, d);
    dayDate.setHours(0, 0, 0, 0);

    // Deadline is configurable
    const deadline = new Date(dayDate);
    deadline.setDate(dayDate.getDate() - 1);
    deadline.setHours(ATTENDANCE_DEADLINE_HOUR, 0, 0, 0);

    // Window is up to configurable days from today (inclusive of today)
    const windowFromNow = new Date(today);
    windowFromNow.setDate(today.getDate() + ATTENDANCE_WINDOW_DAYS);
    
    return now <= deadline && dayDate >= today && dayDate <= windowFromNow;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-6 bg-white/95 rounded-2xl shadow-xl border border-gray-100">
      <div className="flex justify-between items-center mb-4 px-0">
        <button
          onClick={() => {
            if (isPrevDisabled) return;
            const newDate = new Date(year, month - 1, 1);
            setMonth(newDate.getMonth());
            setYear(newDate.getFullYear());
          }}
          className={`p-2 sm:p-3 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-150 ${isPrevDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={isPrevDisabled}
          aria-label="Previous Month"
          title="Previous Month"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-900 text-center flex-1 select-none">
          {new Date(year, month).toLocaleString("default", { month: "long" })} {year}
        </h2>
        <button
          onClick={() => {
            if (isNextDisabled) return;
            const newDate = new Date(year, month + 1, 1);
            setMonth(newDate.getMonth());
            setYear(newDate.getFullYear());
          }}
          className={`p-2 sm:p-3 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-150 ${isNextDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={isNextDisabled}
          aria-label="Next Month"
          title="Next Month"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 text-xs sm:text-sm px-0 py-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300"><span className="w-2 h-2 rounded-full bg-yellow-300 border border-yellow-400"></span>Partial</span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-400"><span className="w-2 h-2 rounded-full bg-gray-400 border border-gray-500"></span>Mess Cut</span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200"><span className="w-2 h-2 rounded-full bg-gray-50 border border-gray-200"></span>Unmarked</span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200"><span className="w-2 h-2 rounded-full bg-gray-100 border border-gray-100"></span>Disabled</span>
      </div>
      <div className="flex justify-center">
        <div className="grid grid-cols-7 gap-1 sm:gap-4 p-1 sm:p-4 min-h-[320px] w-full max-w-2xl border-t border-l border-gray-200 bg-white rounded-xl">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center font-bold text-indigo-700 text-xs sm:text-base select-none py-2 tracking-wide sticky top-0 bg-white z-10">
              {d}
            </div>
          ))}
          {Array(firstWeekday).fill(null).map((_, i) => (
            <div key={"empty-" + i}></div>
          ))}
          {daysArray.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const status = getStatus(dateStr);
            const canBeMarked = isMarkable(dateStr);

            let style = statusStyles[status];
            if (!canBeMarked && status === "unmarked") {
              style = statusStyles["disabled"];
            }

            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

            return (
              <button
                key={day}
                className={`aspect-square w-9 h-9 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border transition-all duration-150 focus:ring-2 focus:ring-indigo-400 text-base sm:text-lg m-0.5 font-semibold select-none ${
                  canBeMarked ? "cursor-pointer hover:bg-indigo-50 hover:shadow-md" : "cursor-not-allowed"
                } ${style} ${isToday ? 'ring-2 ring-pink-500 shadow-lg border-pink-400' : ''}`}
                onClick={() => canBeMarked && openModal(dateStr)}
                disabled={loading || !canBeMarked}
                aria-label={`Mark attendance for ${dateStr}`}
                title={canBeMarked ? `Mark attendance for ${dateStr}` : 'Not markable'}
                tabIndex={canBeMarked ? 0 : -1}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      {/* Loading spinner overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20 rounded-2xl">
          <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
        </div>
      )}
      {/* Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 px-2">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-xs flex flex-col gap-6 border border-indigo-100 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-indigo-600 text-xl font-bold" onClick={() => setSelectedDate(null)} aria-label="Close" disabled={loading}>&times;</button>
            <div className="mb-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-1">
                {(() => {
                  const d = new Date(selectedDate);
                  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) +
                    ' - ' + d.toLocaleDateString(undefined, { weekday: 'long' });
                })()}
              </h3>
            </div>
            <div className="bg-white rounded-xl shadow flex flex-col divide-y divide-gray-200">
              {[
                { label: 'MORNING', value: 'morning' },
                { label: 'NOON', value: 'noon' },
                { label: 'NIGHT', value: 'night' },
              ].map((meal, idx) => (
                <div key={meal.value} className="flex items-center justify-between px-4 py-4">
                  <span className="uppercase font-bold text-lg tracking-wide text-fuchsia-600 select-none">
                    {meal.label}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalMeals[meal.value as 'morning' | 'noon' | 'night']}
                      onChange={e => setModalMeals(m => ({ ...m, [meal.value as 'morning' | 'noon' | 'night']: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-400 rounded-full peer peer-checked:bg-indigo-600 transition-all duration-200"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-all duration-200 peer-checked:translate-x-5"></div>
                  </label>
                </div>
              ))}
            </div>
            <button
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition text-lg font-semibold shadow mt-2 mb-1 active:scale-95"
              onClick={handleMark}
              disabled={loading}
              aria-label="Save Attendance"
              title="Save Attendance"
            >
              {loading ? "Saving..." : "Save Attendance"}
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition text-base font-medium shadow border border-gray-200 active:scale-95" onClick={() => setSelectedDate(null)} disabled={loading} aria-label="Cancel" title="Cancel">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 