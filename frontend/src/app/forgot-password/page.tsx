"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "@/utils/useForm";
import Spinner from '@/components/Spinner';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [genericFormError, setGenericFormError] = useState("");

  const {
    values,
    errors,
    touched,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setErrors,
  } = useForm({
    initialValues: { email: "" },
    validate: (vals) => {
      const errs: Record<string, unknown> = {};
      if (!vals.email) errs.email = "Email is required.";
      // Simple email regex
      else if (!/^\S+@\S+\.\S+$/.test(vals.email)) errs.email = "Enter a valid email address.";
      return errs;
    },
    onSubmit: async (vals) => {
      setErrors({});
      setGenericFormError("");
    setMessage("");
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`, {
          email: vals.email,
      });
      setMessage(res.data.message);
      toast.success(res.data.message);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        setGenericFormError(errorMessage);
      toast.error(errorMessage);
    }
    },
  });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-2 py-6">
      <div className="w-full max-w-xs sm:max-w-sm">
        <div className="bg-white/95 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 flex flex-col items-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-center text-indigo-700 mb-4">Forgot Password</h1>
          <form onSubmit={handleSubmit} className="space-y-4 w-full" autoComplete="on" action="javascript:void(0)">
            <div>
              <label htmlFor="forgot-email" className="block text-gray-600 font-medium mb-1 text-sm">Email</label>
              <input
                id="forgot-email"
                type="email"
                name="email"
                placeholder="Your Email"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black bg-white ${errors.email && touched.email ? 'border-red-400' : ''}`}
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby="forgot-email-error"
              />
              {errors.email && touched.email && <div id="forgot-email-error" className="text-red-500 text-xs mt-1">{errors.email}</div>}
            </div>
            {genericFormError && <div className="text-red-600 text-sm">{genericFormError}</div>}
            {message && <div className="text-green-600 text-sm">{message}</div>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              disabled={submitting || !!message}
            >
              {submitting ? (<><Spinner className="h-5 w-5 mr-2 text-white" />Sending...</>) : "Send Reset Link"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/login" className="text-indigo-600 hover:underline">
              &larr; Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 