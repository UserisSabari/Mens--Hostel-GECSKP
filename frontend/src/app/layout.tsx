import React from 'react';
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Men's Hostel | GEC SKP",
  description: "Official Mess Management App for the Men's Hostel at GEC Sreekrishnapuram. Track attendance, view bills, and stay updated.",
  keywords: ['GECSKP', 'Mess', 'Hostel', 'MH', 'GEC Sreekrishnapuram', 'Attendance'],
  authors: [{ name: 'Sabari & Roomies 2.0' }],
  creator: 'Sabari',
  publisher: 'Sabari',
  openGraph: {
    title: "Men's Hostel | GEC SKP",
    description: "Official Mess Management App for the Men's Hostel.",
    url: 'https://your-app-url.com', // Replace with your actual URL
    siteName: "Men's Hostel App",
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Men's Hostel | GEC Sreekrishnapuram",
    description: "Official Mess Management App for the Men's Hostel.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`bg-gray-50`}>
        <AuthProvider>
          <Header />
          <main className="pt-14 md:pl-56 bg-white min-h-screen">
        {children}
          </main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
