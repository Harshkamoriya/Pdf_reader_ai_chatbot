import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-purple-50/20 backdrop-blur-xl" />
      
      <div className="relative mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-2xl shadow-lg shadow-blue-500/30 transform group-hover:scale-105 transition-all duration-300">
            I
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Intervu
            </span>
            <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-indigo-600 -mt-1">
              INTELLIGENT INTERVIEWS
            </span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Optional mobile menu button - add if you want hamburger later */}
          {/* <button className="md:hidden p-2 rounded-lg hover:bg-gray-100/80">
            <svg className="w-6 h-6" ... hamburger icon />
          </button> */}

          <div className="hidden sm:flex items-center gap-5 text-sm font-medium text-gray-700">
            <Link href="/how-it-works" className="hover:text-indigo-600 transition-colors">
              How it works
            </Link>
            <Link href="/for-companies" className="hover:text-indigo-600 transition-colors">
              For companies
            </Link>
          </div>

          {/* User Button with nicer wrapper */}
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 blur-sm group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-white rounded-full p-0.5 shadow-sm">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 ring-2 ring-white shadow-md",
                    userButtonPopoverCard: "mt-2 border border-gray-200/80 shadow-2xl rounded-xl",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;