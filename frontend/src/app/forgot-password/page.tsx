"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useForm } from "@/utils/useForm";

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
      const errs: any = {};
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
        const res = await axios.post("http://localhost:5000/api/auth/forgot-password", {
          email: vals.email,
        });
        setMessage(res.data.message);
        toast.success(res.data.message);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "An unexpected error occurred.";
        setGenericFormError(errorMessage);
        toast.error(errorMessage);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">Forgot Password</h1>
        <p className="text-center text-black mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black bg-white ${errors.email && touched.email ? 'border-red-400' : ''}`}
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-invalid={!!errors.email}
            aria-describedby="forgot-email-error"
          />
          {errors.email && touched.email && <div id="forgot-email-error" className="text-red-500 text-xs mt-1">{errors.email}</div>}
          {genericFormError && <div className="text-red-600 text-sm">{genericFormError}</div>}
          {message && <div className="text-green-600 text-sm">{message}</div>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={submitting || !!message}
          >
            {submitting ? (<span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Sending...</span>) : "Send Reset Link"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-indigo-600 hover:underline">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 