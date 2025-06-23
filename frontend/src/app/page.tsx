import { HiOutlineUserGroup, HiOutlineMail, HiOutlinePhone, HiOutlineClipboardList, HiOutlineUserCircle } from 'react-icons/hi';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 sm:p-10">
      <div className="w-full max-w-2xl bg-white/95 rounded-2xl shadow-2xl p-4 sm:p-10 flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold text-center text-teal-700 mb-2 tracking-tight drop-shadow">Men's Hostel</h1>
        <p className="text-lg text-gray-800 text-center mb-2">
          Welcome to the Men's Hostel of GEC Sreekrishnapuram – a place that over 130 students call their second home. The hostel offers a comfortable and supportive environment for residents to live, learn, and grow together.
        </p>
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineUserGroup className="text-2xl text-blue-500" />
            <h2 className="text-xl font-bold text-blue-700 tracking-tight">Hostel Administration</h2>
          </div>
          <p className="text-gray-700">
            The hostel is looked after by our Warden, <span className="font-semibold">Mr. Jamshad Ali</span>, HOD of Physics, along with a team of Resident Tutors who ensure everything runs smoothly.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-2 mt-2 shadow-sm">
            <div className="flex items-center gap-2">
              <HiOutlineUserCircle className="text-lg text-blue-400" />
              <span className="font-semibold">Warden Contact:</span>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <HiOutlineMail className="text-base text-blue-400" />
              <a href="mailto:wardenmh@gecskp.ac.in" className="text-blue-700 underline font-medium">wardenmh@gecskp.ac.in</a>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <HiOutlinePhone className="text-base text-blue-400" />
              <a href="tel:+919846272290" className="text-blue-700 underline font-medium">+91 98462 72290</a>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <HiOutlineClipboardList className="text-lg text-blue-400" />
              <span className="font-semibold">Clerk: Rathul</span>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <HiOutlinePhone className="text-base text-blue-400" />
              <a href="tel:+919745401226" className="text-blue-700 underline font-medium">+91 97454 01226</a>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineClipboardList className="text-2xl text-teal-500" />
            <h2 className="text-xl font-bold text-teal-700 tracking-tight">Mess Committee</h2>
          </div>
          <p className="text-gray-700">
            The Mess Committee, made up of:
          </p>
          <ul className="list-disc list-inside text-gray-700 ml-4 mb-2">
            <li>1 Hostel Secretary</li>
            <li>1 Mess Secretary</li>
            <li>2 representatives from each year</li>
          </ul>
          <p className="text-gray-700">
            ...takes care of planning the food menu, organizing special meals, maintaining attendance, and handling mess-related decisions.
          </p>
        </section>
        <div className="mt-4 text-center text-base text-gray-700 flex flex-col gap-2">
          <span className="font-semibold text-teal-700">Contact:</span>
          <div className="flex flex-col gap-1 items-center">
            <div className="flex items-center gap-2">
              <HiOutlineUserCircle className="text-lg text-teal-500" />
              <span className="font-semibold">Adhithyan K</span>
              <a href="tel:+91000000" className="text-blue-700 underline font-medium">+91 000000000</a>
              <span className="font-semibold text-teal-700 ml-1">(Hostel Secretary)</span>
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineUserCircle className="text-lg text-teal-500" />
              <span className="font-semibold">Adhithyan S R</span>
              <a href="tel:+9198000090" className="text-blue-700 underline font-medium">+91 00000000</a>
              <span className="font-semibold text-teal-700 ml-1">(Mess Secretary)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
