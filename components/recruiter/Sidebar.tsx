"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  PlusCircle,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { name: "Candidates", href: "/recruiter/candidates", icon: Users },
  { name: "Settings", href: "/recruiter/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border rounded-md shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              AI Recruiter
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Recruiter Console</p>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-black text-white" 
                      : "text-muted-foreground hover:bg-gray-100 hover:text-black"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t font-medium">
            <Link
              href="/recruiter/jobs/new"
              className="flex items-center gap-2 w-full px-4 py-2 bg-black text-white rounded-lg text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setIsOpen(false)}
            >
              <PlusCircle size={18} />
              Create New Job
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
