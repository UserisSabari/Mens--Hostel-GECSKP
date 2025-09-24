"use client";
import React, { useState } from "react";
import { useCurrentUser } from "@/context/AuthContext";
import { HiOutlineDocumentDownload, HiOutlineExternalLink, HiOutlineTrash } from "react-icons/hi";
import { useForm } from "@/utils/useForm";
import { useNotifications, useCreateNotification, useDeleteNotification } from "@/hooks/useApi";
import Spinner from "@/components/Spinner";
import { FormButton, IconButton } from '@/components/ui'
import type { NotificationItem } from '@/types';

export default function NotificationsPage() {
  const user = useCurrentUser();
  const [deletingNotification, setDeletingNotification] = useState<string | null>(null);
  const [genericFormError, setGenericFormError] = useState("");
  
  // Use React Query hooks
  const { data: notifications = [], isLoading: loading, error } = useNotifications();
  const createNotificationMutation = useCreateNotification();
  const deleteNotificationMutation = useDeleteNotification();

  // useForm for admin notification form
  const {
    values,
    errors,
    touched,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
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
      setGenericFormError("");
      try {
        await createNotificationMutation.mutateAsync(vals);
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

  // Delete notification function
  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }
    
    setDeletingNotification(notificationId);
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
    } catch (err: unknown) {
      console.error('Failed to delete notification:', err);
    } finally {
      setDeletingNotification(null);
    }
  };

  // Notifications are now fetched automatically by React Query

  if (loading) {
    return <Spinner className="min-h-screen" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
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
            <FormButton type="submit" className="w-full mt-2" loading={submitting}>Add Notification</FormButton>
          </form>
        )}
        {error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No notifications yet.</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {notifications.map((n: NotificationItem) => (
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
                  {user?.role === "admin" && (
                    <IconButton
                      onClick={() => handleDeleteNotification(n._id)}
                      disabled={deletingNotification === n._id}
                      className="bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 shadow transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg"
                      title="Delete notification"
                      loading={deletingNotification === n._id}
                    >
                      <HiOutlineTrash className="text-lg" />
                    </IconButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 