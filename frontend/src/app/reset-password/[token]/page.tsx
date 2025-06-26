"use client";

import React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "@/utils/useForm";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const [genericFormError, setGenericFormError] = useState("");
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

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
    initialValues: { password: "", confirmPassword: "" },
    validate: (vals) => {
      const errs: Record<string, unknown> = {};
      if (!vals.password) errs.password = "Password is required.";
      else if (vals.password.length < 6) errs.password = "Password must be at least 6 characters.";
      if (!vals.confirmPassword) errs.confirmPassword = "Please confirm your password.";
      else if (vals.password !== vals.confirmPassword) errs.confirmPassword = "Passwords do not match.";
      return errs;
    },
    onSubmit: async (vals) => {
      setErrors({});
      setGenericFormError("");
      setMessage("");
      try {
        const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
          password: vals.password,
        });
        setMessage(res.data.message);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "An unexpected error occurred.";
        setGenericFormError(errorMessage);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border">
        <h1 className="text-2xl font-bold text-center text-teal-700 mb-6">Reset Your Password</h1>
        {!message ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              name="password"
              placeholder="New Password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.password && touched.password ? 'border-red-400' : ''}`}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={!!errors.password}
              aria-describedby="reset-password-error"
            />
            {errors.password && touched.password && <div id="reset-password-error" className="text-red-500 text-xs mt-1">{errors.password}</div>}
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-400' : ''}`}
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={!!errors.confirmPassword}
              aria-describedby="reset-confirm-error"
            />
            {errors.confirmPassword && touched.confirmPassword && <div id="reset-confirm-error" className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
            {genericFormError && <div className="text-red-600 text-sm">{genericFormError}</div>}
            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors"
              disabled={submitting}
            >
              {submitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : (
           <div className="text-center">
            <p className="p-3 bg-green-100 text-green-700 border border-green-200 rounded-lg">{message}</p>
            <p className="mt-4 text-gray-600">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
} 