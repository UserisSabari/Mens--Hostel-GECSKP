"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Prefetch key routes to make the app feel instant after login/app mount
export default function RoutePrefetcher() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // Always prefetch login (for logout flows)
    router.prefetch('/login');
    // Prefetch dashboard for logged-in users
    if (isLoggedIn) {
      router.prefetch('/dashboard');
      router.prefetch('/notifications');
      router.prefetch('/mess-bill');
    }
  }, [router, isLoggedIn]);

  return null;
}


