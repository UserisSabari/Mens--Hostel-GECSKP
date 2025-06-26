"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { HiMenu } from "react-icons/hi";

type TopbarProps = {
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

export default function Topbar({ setSidebarOpen }: TopbarProps) {
  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200 flex items-center px-6 py-2 h-14 fixed top-0 left-0 z-50">
      <div className="flex items-center gap-3">
        {/* Real Hamburger Menu Button */}
        <button
          className="md:hidden p-2 -ml-2 z-[60] focus:outline-none"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle sidebar"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-indigo-700 leading-tight">Men's Hostel</span>
          <span className="text-xs font-medium text-left bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-tight">
            Government Engineering College<br />Sreekrishnapuram, Palakkad
          </span>
        </div>
      </div>
    </header>
  );
} 