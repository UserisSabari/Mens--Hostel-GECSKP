// Shared application types used across the frontend

export type AttendanceItem = { date: string; meals: { morning: boolean; noon: boolean; night: boolean } };
export type UserData = { _id?: string; name: string; email: string; role: string; userId?: string };
export type Bill = { _id: string; month: string; year: number; previewUrl: string; url: string };
export type NotificationItem = { _id: string; title: string; message?: string; pdfUrl: string; type?: string; createdAt: string };
export type SummaryDetail = { name: string; morning?: boolean; noon?: boolean; night?: boolean; morningAbsent?: boolean; noonAbsent?: boolean; nightAbsent?: boolean };
export type AttendanceSummary = { summary: { morning: number; noon: number; night: number }; details?: SummaryDetail[] };
