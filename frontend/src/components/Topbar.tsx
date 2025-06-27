"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import Image from 'next/image';

type TopbarProps = {
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

export default function Topbar({ setSidebarOpen }: TopbarProps) {
  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200 flex items-center px-2 sm:px-6 py-2 h-14 fixed top-0 left-0 z-50">
      <div className="flex items-center gap-2 sm:gap-4 w-full">
        {/* Hamburger Menu Button - more left, larger touch area */}
        <button
          className="md:hidden p-2 sm:p-2.5 ml-0 mr-0 rounded-full hover:bg-indigo-50 active:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle sidebar"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="MH App Logo"
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-indigo-200 shadow bg-white object-cover mr-2"
          width={32}
          height={32}
        />
        {/* App Name and Subtitle */}
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-base sm:text-lg font-semibold text-indigo-700 leading-tight truncate">Mens Hostel</span>
          <span className="text-[10px] sm:text-xs font-normal text-left text-gray-500 leading-tight max-w-full sm:max-w-[180px] sm:truncate whitespace-normal sm:whitespace-nowrap">
            Government Engineering College, Sreekrishnapuram
          </span>
        </div>
      </div>
    </header>
  );
} 