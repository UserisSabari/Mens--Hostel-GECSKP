import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

// Shared types used across hooks/components
export type AttendanceItem = { date: string; meals: { morning: boolean; noon: boolean; night: boolean } };
export type UserData = { _id?: string; name: string; email: string; role: string; userId?: string };
export type Bill = { _id: string; month: string; year: number; previewUrl: string; url: string };
export type NotificationItem = { _id: string; title: string; message?: string; pdfUrl: string; type?: string; createdAt: string };
export type SummaryDetail = { name: string; morning?: boolean; noon?: boolean; night?: boolean; morningAbsent?: boolean; noonAbsent?: boolean; nightAbsent?: boolean };
export type AttendanceSummary = { summary: { morning: number; noon: number; night: number }; details?: SummaryDetail[] };

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
      const response = await api.get('/api/auth/me');
      if (response.error) throw new Error(response.error);
      const data = response.data as { user?: UserData } | undefined;
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
      const response = await api.get(`/api/attendance/month?month=${month}`);
      if (response.error) throw new Error(response.error);
      const data = response.data as { attendance?: AttendanceItem[] } | undefined;
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
      const response = await api.get(`/api/attendance/admin/summary?date=${date}`);
      if (response.error) throw new Error(response.error);
      const data = response.data as AttendanceSummary | undefined;
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
      const response = await api.get('/api/mess-bill');
      if (response.error) throw new Error(response.error);
      const data = response.data as { bills?: Bill[] } | undefined;
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
      const response = await api.get('/api/notifications');
      if (response.error) throw new Error(response.error);
      const data = response.data as { notifications?: NotificationItem[] } | undefined;
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
      const response = await api.get('/api/auth/users');
      if (response.error) throw new Error(response.error);
      const data = response.data as { users?: UserData[] } | undefined;
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
      const response = await api.post('/api/attendance/mark', data);
      if (response.error) throw new Error(response.error);
      return response.data;
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
      const response = await api.post('/api/auth/register', data);
      if (response.error) throw new Error(response.error);
      return response.data;
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
      const response = await api.post('/api/mess-bill', data);
      if (response.error) throw new Error(response.error);
      return response.data;
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
      const response = await api.delete(`/api/mess-bill/${billId}`);
      if (response.error) throw new Error(response.error);
      return response.data;
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
      const response = await api.post('/api/notifications', data);
      if (response.error) throw new Error(response.error);
      return response.data;
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
      const response = await api.delete(`/api/notifications/${notificationId}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
