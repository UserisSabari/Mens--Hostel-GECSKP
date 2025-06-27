"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Add user type
interface User {
  name: string;
  email: string;
  role: string;
  userId: string;
}

type AuthContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  loading: boolean;
  user: User | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUser({
          name: decoded.name || "",
          email: decoded.email || "",
          role: decoded.role || "student",
          userId: decoded.userId || "",
        });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
    // Listen for storage changes (cross-tab logout/login)
    const handler = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          setUser({
            name: decoded.name || "",
            email: decoded.email || "",
            role: decoded.role || "student",
            userId: decoded.userId || "",
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, loading, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Updated hook to get current user from context
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
} 