"use client";
import React from "react";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateEmail, validatePassword } from "@/utils/validation";
import { useForm } from "@/utils/useForm";
import { useCreateUser } from "@/hooks/useApi";
import Spinner from "@/components/Spinner";

export default function CreateUserPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const createUserMutation = useCreateUser();

  // useForm hook
  const {
    values,
    touched,
    errors,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: { name: "", email: "", password: "" },
    validate: (vals) => {
      const errs: Record<string, string> = {};
      if (!vals.name) errs.name = "Name is required";
      if (!validateEmail(vals.email)) errs.email = "Enter a valid email address";
      if (!validatePassword(vals.password)) errs.password = "Password must be at least 6 characters";
      return errs;
    },
    onSubmit: async (vals) => {
    try {
      await createUserMutation.mutateAsync(vals);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: unknown) {
        console.error(err);
      }
    },
  });

  // Focus name input on mount
  React.useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-2 py-6">
      <div className="w-full max-w-xs sm:max-w-sm">
        <div className="bg-white/95 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 flex flex-col items-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-center text-indigo-700 mb-4">Create User</h1>
          {submitting || createUserMutation.isPending ? (
            <Spinner className="min-h-[120px]" />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 w-full" autoComplete="on" action="javascript:void(0)">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Name</label>
                <input
                  id="name"
                  ref={nameInputRef}
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base text-gray-900 placeholder-gray-500 ${errors.name && touched.name ? 'border-red-400' : ''}`}
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby="name-error"
                  placeholder="Enter full name"
                />
                {errors.name && touched.name && <div id="name-error" className="text-red-500 text-xs mt-1">{errors.name}</div>}
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base text-gray-900 placeholder-gray-500 ${errors.email && touched.email ? 'border-red-400' : ''}`}
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby="email-error"
                  placeholder="Enter email address"
                />
                {errors.email && touched.email && <div id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</div>}
              </div>
              <div>
                <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Password</label>
                <div className="relative">
                <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base pr-12 text-gray-900 placeholder-gray-500 ${errors.password && touched.password ? 'border-red-400' : ''}`}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  required
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby="password-error"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 focus:outline-none bg-white p-1 rounded-full"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && touched.password && <div id="password-error" className="text-red-500 text-xs mt-1">{errors.password}</div>}
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg font-semibold text-base tracking-wide disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={submitting || createUserMutation.isPending}
              >
                {submitting || createUserMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    Creating...
                  </>
                ) : "Create User"}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-indigo-600 hover:underline text-base">
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 