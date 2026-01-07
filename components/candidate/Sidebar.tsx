"use client";

import { 
  BarChart3, 
  LayoutDashboard, 
  FileText, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Search
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const links = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "My Applications", href: "/candidate/interviews", icon: FileText },
  { label: "Performance", href: "/candidate/performance", icon: BarChart3 },
];

export default function CandidateSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50">
      <div className="p-8">
        <Link href="/candidate/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xl italic leading-none">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Antigravity</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-4">
        <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Main Menu</p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive 
                  ? "bg-black text-white shadow-lg shadow-black/10" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-black"
              )}
            >
              <Icon size={20} className={cn("transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-black")} />
              {link.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50 space-y-2">
        <Link
          href="/candidate/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
        >
          <Settings size={20} className="text-gray-400" />
          Settings
        </Link>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 rounded-2xl group border border-transparent hover:border-gray-200 transition-all">
          <div className="flex items-center gap-3">
             <UserButton afterSignOutUrl="/" />
             <div className="text-left">
                <p className="text-xs font-bold leading-none">Candidate</p>
                <p className="text-[10px] text-gray-500 font-medium truncate max-w-[80px]">Pro Account</p>
             </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
