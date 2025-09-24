import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import type { AttendanceItem, UserData, Bill, NotificationItem, AttendanceSummary } from '@/types';

// Small helper to call API and throw on error — keeps code DRY and easier to read
async function callApi<T>(fn: () => Promise<unknown>): Promise<T> {
  const response = await fn() as unknown;
  const resObj = response as { error?: string; data?: T } | undefined;
  if (resObj?.error) throw new Error(resObj.error || 'API error');
  return resObj?.data as T;
}

// Query keys
export const queryKeys = {
  user: ['user'] as const,
  attendance: (month: string) => ['attendance', month] as const,
  messBills: ['messBills'] as const,
  notifications: ['notifications'] as const,
  users: ['users'] as const,
  attendanceSummary: (date: string) => ['attendanceSummary', date] as const,
};

// User queries
export function useUser() {
  return useQuery<UserData | undefined>({
    queryKey: queryKeys.user,
    queryFn: async () => {
      const data = await callApi<{ user?: UserData }>(() => api.get('/api/auth/me'));
      return data?.user;
    },
    // Keep user data fresh; refetch on focus to recover from sleep/idle
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

// Attendance queries
export function useAttendance(month: string) {
  return useQuery<AttendanceItem[]>({
    queryKey: queryKeys.attendance(month),
    queryFn: async () => {
      const data = await callApi<{ attendance?: AttendanceItem[] }>(() => api.get(`/api/attendance/month?month=${month}`));
      return data?.attendance || [];
    },
    enabled: !!month,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAttendanceSummary(date: string) {
  return useQuery<AttendanceSummary | undefined>({
    queryKey: queryKeys.attendanceSummary(date),
    queryFn: async () => {
      const data = await callApi<AttendanceSummary>(() => api.get(`/api/attendance/admin/summary?date=${date}`));
      return data;
    },
    enabled: !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Mess bills queries
export function useMessBills() {
  return useQuery<Bill[]>({
    queryKey: queryKeys.messBills,
    queryFn: async () => {
      const data = await callApi<{ bills?: Bill[] }>(() => api.get('/api/mess-bill'));
      return data?.bills || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Notifications queries
export function useNotifications() {
  return useQuery<NotificationItem[]>({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const data = await callApi<{ notifications?: NotificationItem[] }>(() => api.get('/api/notifications'));
      return data?.notifications || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Users queries (admin only)
export function useUsers(enabled: boolean = true) {
  return useQuery<UserData[]>({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const data = await callApi<{ users?: UserData[] }>(() => api.get('/api/auth/users'));
      return data?.users || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutations
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { date: string; meals: { morning: boolean; noon: boolean; night: boolean } }) => {
      return await callApi(() => api.post('/api/attendance/mark', data));
    },
    onSuccess: (_, variables) => {
      // Invalidate attendance queries for the month
      const month = variables.date.substring(0, 7); // YYYY-MM
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance(month) });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      return await callApi(() => api.post('/api/auth/register', data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useCreateMessBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { month: string; year: number; previewUrl: string; url: string }) => {
      return await callApi(() => api.post('/api/mess-bill', data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messBills });
    },
  });
}

export function useDeleteMessBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (billId: string) => {
      return await callApi(() => api.delete(`/api/mess-bill/${billId}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messBills });
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; message?: string; pdfUrl: string; type?: string }) => {
      return await callApi(() => api.post('/api/notifications', data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      return await callApi(() => api.delete(`/api/notifications/${notificationId}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
