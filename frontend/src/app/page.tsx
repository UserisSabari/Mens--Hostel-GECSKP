import React from 'react';
import { HiOutlineUserGroup, HiOutlineMail, HiOutlinePhone, HiOutlineClipboardList, HiOutlineUserCircle } from 'react-icons/hi';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-50 p-4 sm:p-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-4 sm:p-10 flex flex-col gap-8 border border-indigo-100">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-2 tracking-tight drop-shadow">Men's Hostel</h1>
        <p className="text-lg text-gray-900 text-center mb-2">
          Welcome to the Men's Hostel of GEC Sreekrishnapuram – a place that over 130 students call their second home. The hostel offers a comfortable and supportive environment for residents to live, learn, and grow together.
        </p>
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineUserGroup className="text-2xl text-indigo-500" />
            <h2 className="text-xl font-bold text-indigo-700 tracking-tight">Hostel Administration</h2>
          </div>
          <p className="text-gray-800">
            The hostel is looked after by our Warden, <span className="font-semibold text-indigo-700">Mr. Jamshad Ali</span>, HOD of Physics, along with a team of Resident Tutors who ensure everything runs smoothly.
          </p>
          <div className="bg-indigo-50 rounded-xl p-4 flex flex-col gap-2 mt-2 shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2">
              <HiOutlineUserCircle className="text-lg text-indigo-400" aria-label="Warden" />
              <span className="font-semibold text-gray-900">Warden Contact:</span>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <HiOutlineMail className="text-base text-indigo-400" />
              <a href="mailto:wardenmh@gecskp.ac.in" className="text-indigo-700 underline font-medium hover:text-amber-500 transition-colors">wardenmh@gecskp.ac.in</a>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <HiOutlinePhone className="text-base text-indigo-400" />
              <a href="tel:+919846272290" className="text-indigo-700 underline font-medium hover:text-amber-500 transition-colors">+91 98462 72290</a>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <HiOutlineClipboardList className="text-lg text-indigo-400" aria-label="Hostel Clerk" />
              <span className="font-semibold text-gray-900">Hostel Clerk: Rathul</span>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <HiOutlineMail className="text-base text-indigo-400" />
              <a href="mailto:mh@gecskp.ac.in" className="text-indigo-700 underline font-medium hover:text-amber-500 transition-colors">mh@gecskp.ac.in</a>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <HiOutlinePhone className="text-base text-indigo-400" />
              <a href="tel:+919745401226" className="text-indigo-700 underline font-medium hover:text-amber-500 transition-colors">+91 97454 01226</a>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineClipboardList className="text-2xl text-amber-500" />
            <h2 className="text-xl font-bold text-amber-600 tracking-tight">Mess Committee</h2>
          </div>
          <p className="text-gray-800">
            The Mess Committee, made up of:
          </p>
          <ul className="list-disc list-inside text-gray-800 ml-4 mb-2">
            <li>1 Hostel Secretary</li>
            <li>1 Mess Secretary</li>
            <li>2 representatives from each year</li>
          </ul>
          <p className="text-gray-800">
            ...takes care of planning the food menu, organizing special meals, maintaining attendance, and handling mess-related decisions.
          </p>
        </section>
        <div className="mt-8 text-center text-base text-gray-800 flex flex-col gap-2">
          <span className="font-semibold text-indigo-600">Contact:</span>
          <div className="flex flex-col gap-2 items-center">
            {/* Hostel Secretary */}
            <div className="flex items-center gap-2">
              <HiOutlineUserCircle className="text-lg text-indigo-500" aria-label="Hostel Secretary" />
              <span className="font-semibold">Adhithyan K</span>
              <span className="font-semibold text-indigo-700 ml-1">(Hostel Secretary)</span>
              <a href="tel:+9198000090" className="text-indigo-600 underline font-medium ml-2 hover:text-amber-500 transition-colors">+91 98000 090</a>
            </div>
            {/* Mess Secretary */}
            <div className="flex items-center gap-2">
              <HiOutlineUserCircle className="text-lg text-indigo-500" aria-label="Mess Secretary" />
              <span className="font-semibold">Adhithyan S R</span>
              <span className="font-semibold text-indigo-700 ml-1">(Mess Secretary)</span>
              <a href="tel:+9198000090" className="text-indigo-600 underline font-medium ml-2 hover:text-amber-500 transition-colors">+91 98000 090</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
