"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { useAuth, useCurrentUser } from "@/context/AuthContext";
import { useAttendanceSummary, useUsers, useAttendance, SummaryDetail } from "@/hooks/useApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { monthNames } from "@/constants/months";
import Spinner from "@/components/Spinner";

// Simplified dashboard component without infinite loops
function DashboardContent() {
  const [date, setDate] = useState<string>("");
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const [calendarYear, setCalendarYear] = useState<number | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [navLoading, setNavLoading] = useState<{[key: string]: boolean}>({});
  const user = useCurrentUser();
  const lastUserIdRef = useRef<string | null>(null);
  
  type AttendanceRecord = { date: string; meals: { morning: boolean; noon: boolean; night: boolean } };
  
  // Use React Query hooks
  const { data: attendanceSummary, isLoading: loadingSummary, error: summaryError } = useAttendanceSummary(date);
  // Only fetch users when current user is admin to avoid 403 from server
  const { data: users = [] } = useUsers(user?.role === 'admin');
  
  // Get month string for student attendance
  const monthStr = calendarYear && calendarMonth !== null 
    ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}` 
    : '';
  const { data: studentAttendance = [], isLoading: detailsLoading, error: detailsError } = useAttendance(monthStr);

  // Handle back button to prevent going back to login
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isLoggedIn && window.location.pathname === '/login') {
        event.preventDefault();
        router.replace('/dashboard');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn, router]);

  // Reset user-specific state when user changes - SIMPLIFIED
  useEffect(() => {
    if (user?.userId && lastUserIdRef.current !== user.userId) {
      lastUserIdRef.current = user.userId;
      setDate("");
      setCalendarYear(null);
      setCalendarMonth(null);
      setShowCalendar(true);
      setNavLoading({});
    }
  }, [user?.userId]);

  const handleNav = (key: string, href: string, router: ReturnType<typeof useRouter>) => {
    setNavLoading(l => ({ ...l, [key]: true }));
    router.push(href);
  };

  // Helper function to handle PDF generation and opening
  const handlePDFExport = (doc: jsPDF, filename: string) => {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      downloadLink.setAttribute('type', 'application/pdf');
      downloadLink.setAttribute('data-downloadurl', `application/pdf:${filename}:${pdfUrl}`);
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 2000);
    } else {
      window.open(pdfUrl, '_blank');
      
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = filename;
      downloadLink.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 2000);
    }
  };

  const exportTableToPDF = () => {
    const doc = new jsPDF();
    const generatedDate = new Date().toLocaleString();
    const userName = user?.name || '';
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedDate} | Name: ${userName}`, 10, 10);
    
    const columns = [
      { header: "Date", dataKey: "date" },
      { header: "Morning", dataKey: "morning" },
      { header: "Noon", dataKey: "noon" },
      { header: "Night", dataKey: "night" },
    ];
    
    const year = calendarYear ?? new Date().getFullYear();
    const month = (calendarMonth ?? new Date().getMonth());
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const allDates = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    });
    
    const rows = allDates.map(dateStr => {
    const record = studentAttendance.find((d: AttendanceRecord) => d.date === dateStr);
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
        const raw = data.cell.raw as unknown;
        if (
          raw &&
          typeof raw === 'object' &&
          'styles' in raw &&
          'text' in raw
        ) {
          const typedRaw = raw as { styles: { textColor: [number, number, number] }, text: string };
          data.cell.styles.textColor = typedRaw.styles.textColor;
          data.cell.text = [typedRaw.text];
        }
      },
    });
    
    const monthName = monthNames[month];
    handlePDFExport(doc, `Attendance_${monthName}_${year}`);
  };

  const exportSummaryToPDF = () => {
    if (!attendanceSummary?.summary || !date) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Mess Cut Summary", 14, 18);
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 14, 30);
  doc.text(`Morning: ${attendanceSummary.summary.morning}`, 14, 40);
  doc.text(`Noon: ${attendanceSummary.summary.noon}`, 14, 50);
  doc.text(`Night: ${attendanceSummary.summary.night}`, 14, 60);
    
    if (attendanceSummary.details && attendanceSummary.details.length > 0) {
      const columns = [
        { header: "Sl No", dataKey: "slno" },
        { header: "Name", dataKey: "name" },
        { header: "Morning", dataKey: "morning" },
        { header: "Noon", dataKey: "noon" },
        { header: "Night", dataKey: "night" },
      ];
    type SummaryDetail = { name: string; morning?: boolean; noon?: boolean; night?: boolean; morningAbsent?: boolean; noonAbsent?: boolean; nightAbsent?: boolean };
    const rows = attendanceSummary.details.map((d: SummaryDetail, i: number) => {
      // Prefer explicit 'XxxAbsent' flags if present, otherwise fall back to legacy boolean
      const morningAbsent = typeof d.morningAbsent === 'boolean' ? d.morningAbsent : !!d.morning;
      const noonAbsent = typeof d.noonAbsent === 'boolean' ? d.noonAbsent : !!d.noon;
      const nightAbsent = typeof d.nightAbsent === 'boolean' ? d.nightAbsent : !!d.night;
        return {
          slno: i + 1,
          name: d.name,
          morning: morningAbsent ? { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } } : { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } },
          noon: noonAbsent ? { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } } : { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } },
          night: nightAbsent ? { text: 'No', styles: { textColor: [220, 38, 38] as [number, number, number] } } : { text: 'Yes', styles: { textColor: [34, 197, 94] as [number, number, number] } },
        };
      });
      autoTable(doc, {
        startY: 70,
        columns,
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [99, 102, 241] },
        didParseCell: function (data) {
          const raw = data.cell.raw as unknown;
          if (
            raw &&
            typeof raw === 'object' &&
            'styles' in raw &&
            'text' in raw
          ) {
            const typedRaw = raw as { styles: { textColor: [number, number, number] }, text: string };
            data.cell.styles.textColor = typedRaw.styles.textColor;
            data.cell.text = [typedRaw.text];
          }
        },
      });
    }
    
    handlePDFExport(doc, "Mess_Cut_Summary");
  };

  const userCount = users.length;

  if (loading) {
    return <Spinner className="min-h-screen" />;
  }

  if (!isLoggedIn) {
    return null;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Admin Dashboard
  if (user.role === "admin") {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-0 sm:p-4 md:p-6 mt-2">
        <div className="w-full max-w-4xl flex flex-col gap-6 items-center justify-start mt-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 w-full text-center">Admin Dashboard</h1>
          
          {/* User Management Section */}
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center bg-white/95 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-lg shadow-sm">{userCount}</span>
                <span className="text-gray-700 font-medium">Total Students</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2 justify-center disabled:opacity-60"
                onClick={() => handleNav('createUser', '/dashboard/create-user', router)}
                disabled={!!navLoading.createUser}
              >
                {navLoading.createUser ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                )}
                Create New User
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center bg-white/95 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-gray-700 font-medium">Notifications</span>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                className="w-full bg-pink-500 text-white px-4 py-2 rounded-lg shadow hover:bg-pink-600 transition-colors font-semibold flex items-center gap-2 justify-center disabled:opacity-60"
                onClick={() => handleNav('addNotification', '/notifications', router)}
                disabled={!!navLoading.addNotification}
              >
                {navLoading.addNotification ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                )}
                Add Notification
              </button>
            </div>
          </div>

          {/* Reports Section */}
          <div className="w-full flex flex-col sm:flex-row gap-4 items-center bg-white/95 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-gray-700 font-medium">Reports</span>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 justify-center disabled:opacity-60"
                onClick={() => handleNav('monthlyReport', '/dashboard/monthly-report', router)}
                disabled={!!navLoading.monthlyReport}
              >
                {navLoading.monthlyReport ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                )}
                Monthly Mess Cut Report
              </button>
            </div>
          </div>

          {/* Attendance Summary Section */}
          <div className="w-full flex flex-col gap-4 bg-white/95 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <span className="text-gray-700 font-medium mb-2">Attendance Summary</span>
            <div className="flex flex-col sm:flex-row gap-2 items-center w-full mb-2">
              <label className="font-medium text-gray-700">Select Date:</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2"
                disabled={!date || loadingSummary}
              >
                {loadingSummary ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <span>Get Details</span>
                )}
              </button>
            </div>
            {summaryError && <div className="text-red-600 font-medium mb-2 text-center">{summaryError.message}</div>}
            
            {attendanceSummary?.summary && (
              <div className="w-full bg-indigo-50 rounded-lg p-4 mb-4 flex flex-col gap-2 shadow border border-indigo-100">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-indigo-700">Summary of Mess Cuts</h2>
                  <button
                    className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition-colors text-sm flex items-center gap-1"
                    onClick={exportSummaryToPDF}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Export to PDF
                  </button>
                </div>
                <div className="text-gray-700 mb-2">Selected Date: <span className="font-semibold">{date}</span></div>
                <div className="flex gap-8">
                  <div className="text-black">Morning: <span className="font-bold text-black">{attendanceSummary.summary.morning}</span></div>
                  <div className="text-black">Noon: <span className="font-bold text-black">{attendanceSummary.summary.noon}</span></div>
                  <div className="text-black">Night: <span className="font-bold text-black">{attendanceSummary.summary.night}</span></div>
                </div>
              </div>
            )}
            
            {attendanceSummary?.details && attendanceSummary.details.length > 0 && (
              <div className="w-full overflow-x-auto rounded-lg border border-indigo-100">
                <table className="min-w-full text-sm sm:text-base">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-black">Sl No</th>
                      <th className="px-3 py-2 text-left text-black">Name</th>
                      <th className="px-3 py-2 text-black">Morning</th>
                      <th className="px-3 py-2 text-black">Noon</th>
                      <th className="px-3 py-2 text-black">Night</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceSummary.details
                      .filter((d: SummaryDetail) => {
                        const morningAbsent = typeof d.morningAbsent === 'boolean' ? d.morningAbsent : !!d.morning;
                        const noonAbsent = typeof d.noonAbsent === 'boolean' ? d.noonAbsent : !!d.noon;
                        const nightAbsent = typeof d.nightAbsent === 'boolean' ? d.nightAbsent : !!d.night;
                        return morningAbsent || noonAbsent || nightAbsent;
                      })
                      .map((d: SummaryDetail, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 text-black text-center whitespace-nowrap">{i + 1}</td>
                          <td className="px-3 py-2 text-black whitespace-nowrap">{d.name}</td>
                          {(() => {
                            const morningAbsent = typeof d.morningAbsent === 'boolean' ? d.morningAbsent : !!d.morning;
                            const noonAbsent = typeof d.noonAbsent === 'boolean' ? d.noonAbsent : !!d.noon;
                            const nightAbsent = typeof d.nightAbsent === 'boolean' ? d.nightAbsent : !!d.night;
                            return (
                              <>
                                <td className={`px-3 py-2 text-center font-bold ${morningAbsent ? 'text-red-600' : 'text-green-600'}`}>{morningAbsent ? 'No' : 'Yes'}</td>
                                <td className={`px-3 py-2 text-center font-bold ${noonAbsent ? 'text-red-600' : 'text-green-600'}`}>{noonAbsent ? 'No' : 'Yes'}</td>
                                <td className={`px-3 py-2 text-center font-bold ${nightAbsent ? 'text-red-600' : 'text-green-600'}`}>{nightAbsent ? 'No' : 'Yes'}</td>
                              </>
                            );
                          })()}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {attendanceSummary?.details && attendanceSummary.details.length === 0 && attendanceSummary?.summary && (
              <div className="text-center text-gray-500 py-6 text-base">No attendance details found for this date.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-0 sm:p-4 md:p-6 mt-2">
      {/* User Info Card */}
      <div className="w-full max-w-3xl flex flex-col gap-1 items-center justify-start bg-white/95 rounded-2xl shadow-xl p-4 sm:p-6 mt-2 sm:mt-4 border border-gray-100 mb-4">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold shadow-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Welcome, {user.name}!</h1>
            <span className="inline-block mt-1 text-xs sm:text-sm bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full w-fit">Student</span>
          </div>
        </div>
      </div>

      {/* Calendar/Table Section */}
      <div className="w-full max-w-3xl mx-auto">
        {showCalendar ? (
          <>
            <div className="bg-white/90 rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100">
              <AttendanceCalendar
                key={user?.userId}
                onMonthChange={(year: number, month: number) => {
                  setCalendarYear(year);
                  setCalendarMonth(month);
                }}
              />
              <div className="flex flex-col items-center mt-4 gap-2">
                <button
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors font-semibold text-base sm:text-lg flex items-center gap-2 w-full sm:w-auto justify-center"
                  onClick={() => {
                    setShowCalendar(false);
                  }}
                  disabled={detailsLoading}
                >
                  {detailsLoading ? (
                    <Spinner className="h-5 w-5 mr-2" />
                  ) : (
                    <>
                      <span>Get My Details</span>
                    </>
                  )}
                </button>
                {detailsError && <div className="text-red-600 font-medium mt-2 text-center w-full">{detailsError.message}</div>}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white/90 rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100 flex flex-col items-center mt-0">
            <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full justify-between items-center">
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium w-full sm:w-auto"
                onClick={() => setShowCalendar(true)}
              >
                Back to Calendar
              </button>
              <button
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={exportTableToPDF}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Export to PDF
              </button>
            </div>
            <div className="w-full mt-0 overflow-x-auto rounded-lg border border-indigo-100">
              <table className="min-w-full text-sm sm:text-base">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-indigo-700">Date</th>
                    <th className="px-2 sm:px-3 py-2 text-indigo-700">Morning</th>
                    <th className="px-2 sm:px-3 py-2 text-indigo-700">Noon</th>
                    <th className="px-2 sm:px-3 py-2 text-indigo-700">Night</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const year = calendarYear ?? new Date().getFullYear();
                    const month = (calendarMonth ?? new Date().getMonth());
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const allDates = Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    });
                    return allDates.map((dateStr, i) => {
                      const record = studentAttendance.find((d: AttendanceRecord) => d.date === dateStr);
                      const meals = record ? record.meals : { morning: true, noon: true, night: true };
                      return (
                        <tr key={i} className="border-t">
                          <td className="px-2 sm:px-3 py-2 text-black text-center whitespace-nowrap">{dateStr}</td>
                          <td className="px-2 sm:px-3 py-2 text-center font-bold">
                            {meals.morning ? (
                              <span className="inline-flex items-center gap-1 text-green-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Yes</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>No</span>
                            )}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-center font-bold">
                            {meals.noon ? (
                              <span className="inline-flex items-center gap-1 text-green-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Yes</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>No</span>
                            )}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-center font-bold">
                            {meals.night ? (
                              <span className="inline-flex items-center gap-1 text-green-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Yes</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>No</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              {studentAttendance.length === 0 && (
                <div className="text-center text-gray-500 py-6 text-base">No attendance data found for this month.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <DashboardContent key={user?.userId || 'no-user'} />
  );
}