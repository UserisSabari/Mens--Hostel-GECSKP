"use client";
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/utils/api";

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
  updateUserFromToken: () => void; // Add function to manually update user
  logout: () => void; // Add logout function
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Function to update user from token (fallback)
  const updateUserFromToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const newUser = {
          name: decoded.name || "",
          email: decoded.email || "",
          role: decoded.role || "student",
          userId: decoded.userId || "",
        };
        setUser(prevUser => {
          // Only update if the user actually changed
          if (!prevUser || prevUser.userId !== newUser.userId || prevUser.role !== newUser.role) {
            return newUser;
          }
          return prevUser;
        });
        setIsLoggedIn(true);
      } catch {
        setUser(null);
        setIsLoggedIn(false);
      }
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setIsLoggedIn(false);
      window.dispatchEvent(new Event("authStateChanged"));
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        // Try to fetch user from server first
        try {
          const response = await api.get('/api/auth/me');
          const data = response.data as { user?: User } | undefined;
          if (data?.user) {
            setUser(data.user);
            setIsLoggedIn(true);
          } else {
            setUser(null);
            setIsLoggedIn(false);
          }
        } catch (err: unknown) {
          console.error('Failed to fetch user:', err);
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    };

    initializeAuth();
    
    // Listen for storage changes (cross-tab logout/login)
    const storageHandler = () => {
      updateUserFromToken();
    };
    
    // Listen for custom auth events (same-tab logout/login)
    const authHandler = () => {
      updateUserFromToken();
    };
    
    window.addEventListener("storage", storageHandler);
    window.addEventListener("authStateChanged", authHandler);
    
    return () => {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("authStateChanged", authHandler);
    };
  }, [updateUserFromToken]);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    setIsLoggedIn,
    loading,
    user,
    updateUserFromToken,
    logout
  }), [isLoggedIn, loading, user, updateUserFromToken, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
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