"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },  
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Logout" },
  

];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#6B3F28] text-white shadow-md w-full">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Hostel Logo" width={40} height={40} className="rounded" />
            <span className="text-xl font-extrabold tracking-wide">Men's Hostel</span>
          </Link>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-semibold hover:underline underline-offset-4 transition-colors ${pathname === link.href ? "text-yellow-300" : "text-white"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 focus:outline-none"
          onClick={() => setMenuOpen(m => !m)}
          aria-label="Toggle menu"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden bg-[#6B3F28] px-4 pb-2 flex flex-col gap-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-semibold py-2 px-2 rounded hover:bg-yellow-100 hover:text-[#6B3F28] transition-colors ${pathname === link.href ? "bg-yellow-300 text-[#6B3F28]" : "text-white"}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
} 