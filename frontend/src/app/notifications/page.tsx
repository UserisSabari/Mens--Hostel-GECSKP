"use client";
import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/context/AuthContext";
import { HiOutlineDocumentDownload, HiOutlineExternalLink } from "react-icons/hi";
import { useForm } from "@/utils/useForm";
import Spinner from "@/components/Spinner";

interface Notification {
  _id: string;
  title: string;
  message?: string;
  pdfUrl: string;
  type?: string;
  createdAt: string;
  [key: string]: unknown;
}

export default function NotificationsPage() {
  const user = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genericFormError, setGenericFormError] = useState("");

  // useForm for admin notification form
  const {
    values,
    errors,
    touched,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setErrors,
    setValues,
  } = useForm({
    initialValues: { title: "", message: "", pdfUrl: "", type: "" },
    validate: (vals) => {
      const errs: { [key: string]: string } = {};
      if (!vals.title) errs.title = "Title is required.";
      if (!vals.pdfUrl) errs.pdfUrl = "PDF link is required.";
      return errs;
    },
    onSubmit: async (vals) => {
      setErrors({});
      setGenericFormError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(vals),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to add notification");
        }
        const data = await res.json();
        setNotifications([data.notification, ...notifications]);
        setValues({ title: "", message: "", pdfUrl: "", type: "" });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setGenericFormError(err.message || "Failed to add notification");
        } else {
          setGenericFormError("Failed to add notification");
        }
      }
    },
  });

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/notifications`);
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load notifications");
        } else {
          setError("Failed to load notifications");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return <Spinner className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-2 py-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-100 mt-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-indigo-700 mb-6 text-center">Hostel Notifications</h1>
        {user?.role === "admin" && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl bg-white border border-indigo-100 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col">
              <label htmlFor="title" className="text-gray-700 font-medium mb-1 text-sm">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.title && touched.title ? 'border-red-400' : ''}`}
                required
                aria-invalid={!!errors.title}
                aria-describedby="notif-title-error"
              />
              {errors.title && touched.title && <div id="notif-title-error" className="text-red-500 text-xs mt-1">{errors.title}</div>}
            </div>
            <div className="flex flex-col">
              <label htmlFor="message" className="text-gray-700 font-medium mb-1 text-sm">Message (optional)</label>
              <textarea
                id="message"
                name="message"
                value={values.message}
                onChange={handleChange}
                onBlur={handleBlur}
                className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 min-h-[60px]"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="pdfUrl" className="text-gray-700 font-medium mb-1 text-sm">PDF Link (Google Drive or other cloud)</label>
              <input
                id="pdfUrl"
                name="pdfUrl"
                type="url"
                value={values.pdfUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Paste PDF link here"
                className={`rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.pdfUrl && touched.pdfUrl ? 'border-red-400' : ''}`}
                required
                aria-invalid={!!errors.pdfUrl}
                aria-describedby="notif-pdf-error"
              />
              {errors.pdfUrl && touched.pdfUrl && <div id="notif-pdf-error" className="text-red-500 text-xs mt-1">{errors.pdfUrl}</div>}
            </div>
            <div className="flex flex-col">
              <label htmlFor="type" className="text-gray-700 font-medium mb-1 text-sm">Type (optional)</label>
              <input
                id="type"
                name="type"
                type="text"
                value={values.type}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. due, closure, mess-cut"
                className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900"
              />
            </div>
            {genericFormError && <div className="text-red-600 text-sm">{genericFormError}</div>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold mt-2 flex items-center justify-center gap-2" disabled={submitting}>{submitting ? (<span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Adding...</span>) : "Add Notification"}</button>
          </form>
        )}
        {error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No notifications yet.</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {notifications.map((n) => (
              <li key={n._id} className="flex flex-col sm:flex-row items-center justify-between bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100">
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-base sm:text-lg font-medium text-indigo-800">{n.title}</span>
                  <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  {n.type && <div className="text-xs text-indigo-600 font-semibold mt-1">{n.type}</div>}
                  {n.message && <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">{n.message}</div>}
                </div>
                <div className="flex gap-2 mt-3 sm:mt-0">
                  <a
                    href={n.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-100 focus:bg-indigo-100 border border-indigo-200 shadow transition-colors text-sm font-medium"
                  >
                    <HiOutlineExternalLink className="text-lg" /> Preview
                  </a>
                  <a
                    href={n.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:bg-indigo-700 shadow transition-colors text-sm font-medium"
                  >
                    <HiOutlineDocumentDownload className="text-lg" /> Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 