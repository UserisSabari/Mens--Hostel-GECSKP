"use client";
import React, { useState } from "react";
import { HiOutlineDocumentDownload, HiOutlineExternalLink, HiOutlineTrash } from "react-icons/hi";
import { useCurrentUser } from "@/context/AuthContext";
import { monthNames } from "@/constants/months";
import { useForm } from "@/utils/useForm";
import { useMessBills, useCreateMessBill, useDeleteMessBill } from "@/hooks/useApi";
import Spinner from "@/components/Spinner";

// Helper for months
const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];

interface Bill {
  _id: string;
  month: string;
  year: number;
  previewUrl: string;
  url: string;
  [key: string]: unknown;
}

export default function MessBillPage() {
  const [deletingBill, setDeletingBill] = useState<string | null>(null);
  const user = useCurrentUser();
  const [genericFormError, setGenericFormError] = useState("");
  
  // Use React Query hooks
  const { data: bills = [], isLoading: loading, error } = useMessBills();
  const createBillMutation = useCreateMessBill();
  const deleteBillMutation = useDeleteMessBill();

  // useForm for admin bill form
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
    initialValues: {
      month: monthNames[new Date().getMonth()],
      year: currentYear,
      previewUrl: "",
      url: "",
    },
    validate: (vals) => {
      const errs: { [key: string]: string } = {};
      if (!vals.previewUrl) errs.previewUrl = "Preview link is required.";
      if (!vals.url) errs.url = "Download link is required.";
      return errs;
    },
    onSubmit: async (vals) => {
      setErrors({});
      setGenericFormError("");
      try {
        await createBillMutation.mutateAsync(vals);
        setValues({ month: monthNames[new Date().getMonth()], year: currentYear, previewUrl: "", url: "" });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setGenericFormError(err.message || "Failed to add bill");
        } else {
          setGenericFormError("Failed to add bill");
        }
      }
    },
  });

  // Delete bill function
  const handleDeleteBill = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this mess bill?")) {
      return;
    }
    
    setDeletingBill(billId);
    try {
      await deleteBillMutation.mutateAsync(billId);
    } catch (err: unknown) {
      console.error('Failed to delete bill:', err);
    } finally {
      setDeletingBill(null);
    }
  };

  // Bills are now fetched automatically by React Query

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
        <h1 className="text-xl sm:text-2xl font-semibold text-indigo-700 mb-6 text-center">Monthly Mess Bills</h1>
        {user?.role === "admin" && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl bg-white border border-indigo-100 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col flex-1">
                <label htmlFor="month" className="text-gray-700 font-medium mb-1 text-sm">Month</label>
                <select id="month" name="month" value={values.month} onChange={handleChange} onBlur={handleBlur} className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900">
                  {monthNames.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col flex-1">
                <label htmlFor="year" className="text-gray-700 font-medium mb-1 text-sm">Year</label>
                <select id="year" name="year" value={values.year} onChange={handleChange} onBlur={handleBlur} className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col">
              <label htmlFor="previewUrl" className="text-gray-700 font-medium mb-1 text-sm">Preview Link (Google Drive preview)</label>
              <input
                id="previewUrl"
                type="url"
                name="previewUrl"
                value={values.previewUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Paste preview link here"
                className={`rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.previewUrl && touched.previewUrl ? 'border-red-400' : ''}`}
                required
                aria-invalid={!!errors.previewUrl}
                aria-describedby="bill-preview-error"
              />
              {errors.previewUrl && touched.previewUrl && <div id="bill-preview-error" className="text-red-500 text-xs mt-1">{errors.previewUrl}</div>}
            </div>
            <div className="flex flex-col">
              <label htmlFor="url" className="text-gray-700 font-medium mb-1 text-sm">Download Link (Google Drive direct)</label>
              <input
                id="url"
                type="url"
                name="url"
                value={values.url}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Paste download link here"
                className={`rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900 ${errors.url && touched.url ? 'border-red-400' : ''}`}
                required
                aria-invalid={!!errors.url}
                aria-describedby="bill-url-error"
              />
              {errors.url && touched.url && <div id="bill-url-error" className="text-red-500 text-xs mt-1">{errors.url}</div>}
            </div>
            {genericFormError && <div className="text-red-600 text-sm">{genericFormError}</div>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold mt-2 flex items-center justify-center gap-2" disabled={submitting}>{submitting ? (<span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Adding...</span>) : "Add Bill"}</button>
          </form>
        )}
        {error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : bills.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No mess bills available yet.</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {bills.map((bill: Bill) => (
              <li key={bill._id} className="flex flex-col sm:flex-row items-center justify-between bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100">
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-base sm:text-lg font-medium text-indigo-800">{bill.month} {bill.year}</span>
                </div>
                <div className="flex gap-2 mt-3 sm:mt-0">
                  <a
                    href={bill.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-100 focus:bg-indigo-100 border border-indigo-200 shadow transition-colors text-sm font-medium"
                  >
                    <HiOutlineExternalLink className="text-lg" /> Preview
                  </a>
                  <a
                    href={bill.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:bg-indigo-700 shadow transition-colors text-sm font-medium"
                  >
                    <HiOutlineDocumentDownload className="text-lg" /> Download
                  </a>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleDeleteBill(bill._id)}
                      disabled={deletingBill === bill._id}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 shadow transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete bill"
                    >
                      {deletingBill === bill._id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                      ) : (
                        <HiOutlineTrash className="text-lg" />
                      )}
                    </button>
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