"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  ChevronRight, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  Plus, 
  Sparkles, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Timer,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Pending Tests", value: "2", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  { label: "Interviews", value: "4", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  { label: "Days Active", value: "12", icon: Zap, color: "text-purple-500", bg: "bg-purple-50" },
];

export default function CandidateDashboard() {
  const [invites, setInvites] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, sessRes, statsRes] = await Promise.all([
          fetch("/api/invites"),
          fetch("/api/candidate/sessions"),
          fetch("/api/candidate/stats")
        ]);

        const [invData, sessData, stData] = await Promise.all([
          invRes.json(),
          sessRes.json(),
          statsRes.json()
        ]);

        if (invData.success) setInvites(invData.data);
        if (sessData.success) setSessions(sessData.data);
        if (stData.success) setStatsData(stData.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl" />)}
        </div>
        <div className="h-96 bg-gray-200 rounded-3xl" />
    </div>
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Good morning, Candidate!</h1>
          <p className="text-lg text-gray-500 font-medium">You have <span className="text-black font-bold">{invites.length} pending invitations</span> this week.</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-bold shadow-sm">
                <Timer size={16} className="text-gray-400" />
                Next Test: <span className="text-blue-600">Tomorrow, 10 AM</span>
            </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black">{i === 0 ? invites.length : (i === 1 ? sessions.length : stat.value)}</p>
            </div>
            <div className={cn("p-4 rounded-2xl transition-colors group-hover:bg-white", stat.bg)}>
              <stat.icon size={24} className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Applications */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles size={20} className="text-blue-500" /> My Applications
                </h2>
                <button className="text-sm font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-wider">View All</button>
            </div>

            <div className="space-y-4">
                {sessions.length > 0 ? sessions.map((session) => (
                    <Link 
                        key={session.id} 
                        href={`/candidate/interviews/${session.id}`}
                        className="block bg-white border border-gray-100 p-6 rounded-[2.5rem] hover:border-black transition-all group shadow-sm hover:shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -z-10 transition-transform group-hover:scale-150 group-hover:bg-blue-50/50" />
                        
                        <div className="flex items-start justify-between">
                            <div className="space-y-4 flex-1">
                                <div>
                                    <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">{session.job.title}</h3>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" /> {session.job.companyId}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Current Status</span>
                                        <span className={cn(
                                            "text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                                            session.status === "PENDING" ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50"
                                        )}>{session.status}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium">Applied {new Date(session.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-full group-hover:bg-black group-hover:text-white transition-all">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </Link>
                )) : (
                    <div className="py-20 bg-white border border-dashed rounded-[3rem] text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="text-gray-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold">No active applications</p>
                            <p className="text-sm text-gray-400">Your interview sessions will appear here once you consume an invite.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar: Invites */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-amber-500" /> Pending Invites
            </h2>

            <div className="space-y-4">
                {invites.map((invite) => (
                    <Link 
                        key={invite.id} 
                        href={`/invite/${invite.token}`}
                        className="block bg-amber-50/50 border border-amber-100 p-6 rounded-[2rem] hover:bg-white hover:border-amber-400 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center">
                                <Bell size={20} className="text-amber-500 animate-bounce-subtle" />
                            </div>
                            <span className="text-[10px] bg-white px-2 py-1 rounded-lg text-amber-600 font-bold uppercase tracking-widest border border-amber-100">Action Needed</span>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-bold text-lg leading-tight">{invite.job.title}</h4>
                            <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest">Expires in 3 days</p>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-sm font-bold group-hover:underline">Start Process</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}

                {invites.length === 0 && (
                    <div className="p-8 bg-gray-50 border border-dashed rounded-[2rem] text-center space-y-3">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-tighter">All caught up!</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">When a recruiter invites you, it will show up here instantly.</p>
                    </div>
                )}
            </div>

            {/* Premium Card Spare */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-white/20 transition-all" />
                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black">AI Readiness</h3>
                        <p className="text-xs text-indigo-100 font-medium leading-relaxed">Prepare for your next technical interview with personalized AI mock tests.</p>
                    </div>
                    <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors">Start Prep</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
