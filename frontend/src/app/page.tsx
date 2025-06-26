"use client";
import React, { useEffect, useState } from 'react';
import { HiOutlineUserGroup, HiOutlineMail, HiOutlinePhone, HiOutlineClipboardList, HiOutlineUserCircle } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Only show splash on first visit
    const splashShown = typeof window !== 'undefined' && sessionStorage.getItem('mhapp_splash_shown');
    if (splashShown) {
      setShowSplash(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('mhapp_splash_shown', '1');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-200 via-white to-indigo-100"
            style={{ minHeight: '100vh' }}
          >
            <motion.img
              src="/logo.png"
              alt="MH App Logo"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0, transition: { duration: 0.6 } }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-indigo-300 shadow-2xl bg-white object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 40 : 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: showSplash ? 0 : 0.2 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-50 px-2 sm:px-4 py-4 sm:py-10"
        style={{ pointerEvents: showSplash ? 'none' : 'auto' }}
      >
        <motion.div
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-3 sm:p-8 flex flex-col gap-5 sm:gap-6 border border-indigo-100"
        >
          <motion.h1
            initial={false}
            animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? -20 : 0 }}
            transition={{ delay: showSplash ? 0 : 0.4, duration: 0.6 }}
            className="text-xl sm:text-3xl font-semibold text-center text-indigo-700 mb-1 tracking-tight drop-shadow-sm"
          >
            Men's Hostel
          </motion.h1>
          <p className="text-sm sm:text-lg text-gray-800 text-center mb-1 font-normal">
            Welcome to the Mens Hostel of GEC Sreekrishnapuram – a place that over 130 students call their second home. The hostel offers a comfortable and supportive environment for residents to live, learn, and grow together.
          </p>
          <section className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-1">
              <HiOutlineUserGroup className="text-lg sm:text-2xl text-indigo-500" />
              <h2 className="text-base sm:text-xl font-medium text-indigo-700 tracking-tight">Hostel Administration</h2>
            </div>
            <p className="text-gray-700 text-xs sm:text-base font-normal">
              The hostel is looked after by our Warden, <span className="font-medium text-indigo-700">Mr. Jamshad Ali</span>, HOD of Physics, along with a team of Resident Tutors who ensure everything runs smoothly.
            </p>
            <div className="bg-indigo-50 rounded-xl p-2 sm:p-3 flex flex-col gap-1 mt-2 shadow-sm border border-indigo-100">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <HiOutlineUserCircle className="text-sm sm:text-base text-indigo-400" aria-label="Warden" />
                <span className="font-medium text-gray-900 text-xs sm:text-sm">Warden Contact:</span>
              </div>
              <div className="flex flex-row items-center gap-2 ml-0 sm:ml-7 mt-1 justify-center">
                <HiOutlineMail className="text-xs sm:text-sm text-indigo-400" />
                <a href="mailto:wardenmh@gecskp.ac.in" className="text-indigo-700 underline font-normal hover:text-amber-500 transition-colors text-xs sm:text-sm break-all">wardenmh@gecskp.ac.in</a>
              </div>
              <div className="flex flex-row items-center gap-2 ml-0 sm:ml-7 mt-1 justify-center">
                <HiOutlinePhone className="text-xs sm:text-sm text-indigo-400" />
                <a href="tel:+919846272290" className="text-indigo-700 underline font-normal hover:text-amber-500 transition-colors text-xs sm:text-sm">+91 98462 72290</a>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-2 justify-center">
                <HiOutlineClipboardList className="text-xs sm:text-base text-indigo-400" aria-label="Hostel Clerk" />
                <span className="font-medium text-gray-900 text-xs sm:text-sm">Hostel Clerk: Rathul</span>
              </div>
              <div className="flex flex-row items-center gap-2 ml-0 sm:ml-7 mt-1 justify-center">
                <HiOutlineMail className="text-xs sm:text-sm text-indigo-400" />
                <a href="mailto:mh@gecskp.ac.in" className="text-indigo-700 underline font-normal hover:text-amber-500 transition-colors text-xs sm:text-sm break-all">mh@gecskp.ac.in</a>
              </div>
              <div className="flex flex-row items-center gap-2 ml-0 sm:ml-7 mt-1 justify-center">
                <HiOutlinePhone className="text-xs sm:text-sm text-indigo-400" />
                <a href="tel:+919745401226" className="text-indigo-700 underline font-normal hover:text-amber-500 transition-colors text-xs sm:text-sm">+91 97454 01226</a>
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-1">
              <HiOutlineClipboardList className="text-lg sm:text-2xl text-amber-500" />
              <h2 className="text-base sm:text-xl font-medium text-amber-600 tracking-tight">Mess Committee</h2>
            </div>
            <p className="text-gray-700 text-xs sm:text-base font-normal">
              The Mess Committee, made up of:
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4 mb-1 text-xs sm:text-base font-normal">
              <li>1 Hostel Secretary</li>
              <li>1 Mess Secretary</li>
              <li>2 representatives from each year</li>
            </ul>
            <p className="text-gray-700 text-xs sm:text-base font-normal">
              ...takes care of planning the food menu, organizing special meals, maintaining attendance, and handling mess-related decisions.
            </p>
          </section>
          <div className="mt-6 text-center text-xs sm:text-sm text-gray-700 flex flex-col gap-2 w-full">
            <span className="block text-base sm:text-lg font-semibold text-indigo-700 mb-2">Contact:</span>
            <div className="flex flex-col gap-2 items-center w-full">
              {/* Hostel Secretary */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 w-full">
                <div className="flex items-center gap-1 sm:gap-2">
                  <HiOutlineUserCircle className="text-sm sm:text-base text-indigo-500" aria-label="Hostel Secretary" />
                  <span className="font-medium">Adhithyan K</span>
                  <span className="font-medium text-indigo-700 ml-1">(Hostel Secretary)</span>
                </div>
                <a href="tel:+919539240174" className="text-indigo-600 underline font-normal ml-0 sm:ml-2 hover:text-amber-500 transition-colors block text-xs sm:text-sm py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300">+91 9539240174</a>
              </div>
              {/* Mess Secretary */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 w-full">
                <div className="flex items-center gap-1 sm:gap-2">
                  <HiOutlineUserCircle className="text-sm sm:text-base text-indigo-500" aria-label="Mess Secretary" />
                  <span className="font-medium">Adhithyan S R</span>
                  <span className="font-medium text-indigo-700 ml-1">(Mess Secretary)</span>
                </div>
                <a href="tel:+917736631572" className="text-indigo-600 underline font-normal ml-0 sm:ml-2 hover:text-amber-500 transition-colors block text-xs sm:text-sm py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300">+91 7736631572</a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
