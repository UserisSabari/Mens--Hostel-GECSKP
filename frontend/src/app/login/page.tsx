"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { validateEmail, validatePassword } from "@/utils/validation";
import { useForm } from "@/utils/useForm";
import { api } from "@/utils/api";
import Image from 'next/image';
import Spinner from '@/components/Spinner';

export default function LoginPage() {
  const router = useRouter();
  const { setIsLoggedIn, updateUserFromToken, isLoggedIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, router]);

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
    initialValues: { email: "", password: "" },
    validate: (vals) => {
      const errs: Record<string, unknown> = {};
      if (!validateEmail(vals.email)) errs.email = "Please enter a valid email address.";
      if (!validatePassword(vals.password)) errs.password = "Password must be at least 6 characters.";
      return errs;
    },
    onSubmit: async (vals) => {
      setErrors({});
    try {
      const response = await api.post('/api/auth/login', vals);
      if (response.error) throw new Error(response.error);
      
      const token = (response.data as { token?: string } | undefined)?.token;
      if (token) {
        localStorage.setItem("token", token);
        setIsLoggedIn(true);
        updateUserFromToken();
        // Dispatch custom event to notify AuthContext of state change
        window.dispatchEvent(new Event("authStateChanged"));
        router.replace("/dashboard"); // Use replace instead of push to prevent back button issues
        toast.success("Login successful!");
      } else {
        throw new Error("Login failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
    },
  });

  // Don't render login form if already authenticated
  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-2 py-6">
      <div className="w-full max-w-xs sm:max-w-sm">
        <div className="bg-white/95 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="MH App Logo"
            className="w-16 h-16 rounded-full border-2 border-indigo-200 shadow mb-3 bg-white object-cover"
            width={64}
            height={64}
          />
          <h1 className="text-xl sm:text-2xl font-semibold text-center text-indigo-700 mb-4">Mess Login</h1>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4 w-full"
            autoComplete="on"
            action="javascript:void(0)"
          >
            <div>
              <label htmlFor="email" className="block text-gray-600 font-medium mb-1 text-sm">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Your Email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black text-sm bg-white ${errors.email && touched.email ? 'border-red-400' : ''}`}
                required
                autoComplete="username email"
                aria-invalid={!!errors.email}
                aria-describedby="login-email-error"
              />
              {errors.email && touched.email && <div id="login-email-error" className="text-red-500 text-xs mt-1">{errors.email}</div>}
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-600 font-medium mb-1 text-sm">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Your Password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black text-sm bg-white ${errors.password && touched.password ? 'border-red-400' : ''}`}
                required
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby="login-password-error"
              />
              {errors.password && touched.password && <div id="login-password-error" className="text-red-500 text-xs mt-1">{errors.password}</div>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg font-semibold text-base tracking-wide disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (<><Spinner className="h-5 w-5 mr-2 text-white" />Logging in...</>) : "Login"}
            </button>
          </form>
        </div>
        <div className="mt-6 text-center">
          <Link href="/forgot-password">
            <span className="inline-block text-indigo-600 font-medium text-sm px-2 py-2 cursor-pointer transition-colors duration-150
              hover:underline focus:underline active:underline rounded focus:outline-none focus:ring-2 focus:ring-indigo-300">
              Forgot Password?
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
} 