"use client";

export default function Topbar() {
  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200 flex items-center px-6 py-2 h-14 fixed top-0 left-0 z-50">
      <div className="flex items-start gap-3">
        {/* Hamburger menu placeholder for spacing; actual button is in Sidebar */}
        <div className="w-8 h-8 md:hidden" />
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