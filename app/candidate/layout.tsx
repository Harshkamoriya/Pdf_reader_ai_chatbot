import CandidateSidebar from "@/components/candidate/Sidebar";
import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex transition-colors duration-300">
      <CandidateSidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between border-b border-gray-100/50">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100 focus-within:border-black transition-all">
            <Search size={18} className="text-gray-400" />
            <input 
                type="text" 
                placeholder="Search assessments, jobs..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all relative">
              <Bell size={20} className="text-gray-600" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-gray-200 mx-2" />
            <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
