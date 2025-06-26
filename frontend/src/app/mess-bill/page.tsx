"use client";
import React, { useState, useEffect } from "react";
import { HiOutlineDocumentDownload, HiOutlineExternalLink } from "react-icons/hi";
import { useCurrentUser } from "@/context/AuthContext";

// Mock data: Replace with real data or fetch from API/cloud later
const messBills = [
  {
    month: "May 2024",
    url: "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_1",
    previewUrl: "https://drive.google.com/file/d/YOUR_FILE_ID_1/preview",
  },
  {
    month: "April 2024",
    url: "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_2",
    previewUrl: "https://drive.google.com/file/d/YOUR_FILE_ID_2/preview",
  },
  // Add more months as needed
];

// Mock admin check (replace with real auth later)
const isAdmin = true;

// Helper for months
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];

export default function MessBillPage() {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const user = useCurrentUser();
  // Admin form state
  const [form, setForm] = useState({
    month: months[new Date().getMonth()],
    year: currentYear,
    previewUrl: "",
    url: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch bills from backend
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/mess-bill");
        if (!res.ok) throw new Error("Failed to fetch mess bills");
        const data = await res.json();
        setBills(data.bills || []);
      } catch (err: any) {
        setError(err.message || "Failed to load mess bills");
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.previewUrl || !form.url) {
      setFormError("Both links are required.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/mess-bill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          month: form.month,
          year: form.year,
          previewUrl: form.previewUrl,
          url: form.url,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add bill");
      }
      const data = await res.json();
      setBills([data.bill, ...bills]);
      setForm({ month: months[new Date().getMonth()], year: currentYear, previewUrl: "", url: "" });
    } catch (err: any) {
      setFormError(err.message || "Failed to add bill");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-2 py-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-100 mt-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-indigo-700 mb-6 text-center">Monthly Mess Bills</h1>
        {user?.role === "admin" && (
          <form onSubmit={handleAddBill} className="mb-8 p-4 rounded-xl bg-white border border-indigo-100 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col flex-1">
                <label htmlFor="month" className="text-gray-700 font-medium mb-1 text-sm">Month</label>
                <select id="month" name="month" value={form.month} onChange={handleFormChange} className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900">
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col flex-1">
                <label htmlFor="year" className="text-gray-700 font-medium mb-1 text-sm">Year</label>
                <select id="year" name="year" value={form.year} onChange={handleFormChange} className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900">
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
                value={form.previewUrl}
                onChange={handleFormChange}
                placeholder="Paste preview link here"
                className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="url" className="text-gray-700 font-medium mb-1 text-sm">Download Link (Google Drive direct)</label>
              <input
                id="url"
                type="url"
                name="url"
                value={form.url}
                onChange={handleFormChange}
                placeholder="Paste download link here"
                className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 bg-white text-gray-900"
                required
              />
            </div>
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold mt-2" disabled={submitting}>{submitting ? "Adding..." : "Add Bill"}</button>
          </form>
        )}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : bills.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No mess bills available yet.</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {bills.map((bill) => (
              <li key={bill.month + bill.url} className="flex flex-col sm:flex-row items-center justify-between bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100">
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-base sm:text-lg font-medium text-indigo-800">{bill.month}</span>
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 