"use client";

import React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "@/utils/useForm";
import Spinner from "@/components/Spinner";

export default function ResetPasswordPage() {
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
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password/${token}`, {
          password: vals.password,
      });
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        setGenericFormError(errorMessage);
    }
    },
  });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-2 py-6">
      <div className="w-full max-w-xs sm:max-w-sm">
        <div className="bg-white/95 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 flex flex-col items-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-center text-indigo-700 mb-4">Reset Password</h1>
          {submitting ? (
            <Spinner className="min-h-[120px]" />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 w-full" autoComplete="on" action="javascript:void(0)">
              <div>
                <label htmlFor="new-password" className="block text-gray-600 font-medium mb-1 text-sm">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  name="password"
                  placeholder="New Password"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.password && touched.password ? 'border-red-400' : ''}`}
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby="reset-password-error"
                />
                {errors.password && touched.password && <div id="reset-password-error" className="text-red-500 text-xs mt-1">{errors.password}</div>}
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-gray-600 font-medium mb-1 text-sm">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-400' : ''}`}
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby="reset-confirm-error"
                />
                {errors.confirmPassword && touched.confirmPassword && <div id="reset-confirm-error" className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
              </div>
              {genericFormError && <div className="text-red-600 text-sm">{genericFormError}</div>}
              <button
                type="submit"
                className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (<span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Resetting...</span>) : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 