"use client";

import { useEffect, useState } from "react";
import { validateInviteToken } from "@/modules/invites/service";
import { 
  CheckCircle2, 
  ArrowRight, 
  Briefcase, 
  Target, 
  ShieldCheck, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function InvitePage({
    params,
}:{params: {token: string}}){
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consuming, setConsuming] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadInvite() {
        const res = await fetch(`/api/invites/validate/${params.token}`);
        const json = await res.json();
        if (json.success) setData(json.data);
        setLoading(false);
    }
    loadInvite();
  }, [params.token]);

  const handleConsume = async () => {
    setConsuming(true);
    try {
        const formData = new FormData();
        formData.append("token", params.token);
        
        const res = await fetch("/api/invites/consume", {
            method: "POST",
            body: formData
        });
        const json = await res.json();
        if (json.success) {
            toast.success("Welcome aboard!");
            router.push(`/candidate/interviews/${json.data.id}`);
        } else {
            throw new Error(json.message);
        }
    } catch (err) {
        toast.error("Invite already used or invalid.");
    } finally {
        setConsuming(false);
    }
  };

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="animate-spin text-gray-400" size={32} />
    </div>
  );

  if(!data){
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
            <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 text-center space-y-6 border border-gray-100">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <ArrowLeft className="text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Invite Expired</h2>
                <p className="text-gray-500 font-medium leading-relaxed">This invitation is no longer valid or has already been used. Please contact your recruiter.</p>
                <Link href="/" className="inline-block pt-4 text-sm font-bold text-gray-400 hover:text-black transition-colors">Return to Home</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-blue-50/50 rounded-full blur-[120px] -mr-[20vw] -mt-[20vw]" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-50/50 rounded-full blur-[100px] -ml-[15vw] -mb-[15vw]" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3.5rem] shadow-2xl shadow-gray-200 border border-gray-50 overflow-hidden relative z-10">
        {/* Left Side: Info */}
        <div className="p-12 lg:p-16 bg-black text-white space-y-10 flex flex-col">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black font-black italic">A</span>
                </div>
                <span className="text-lg font-bold tracking-tight">Antigravity</span>
            </div>

            <div className="space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Official Invitation</span>
                <h1 className="text-4xl font-black leading-tight">Join the team at {data.job.companyId}</h1>
            </div>

            <div className="space-y-6 pt-6">
                <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="p-2 bg-white/10 rounded-xl"><Briefcase size={18} className="text-blue-400" /></div>
                    <span>{data.job.title}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="p-2 bg-white/10 rounded-xl"><Target size={18} className="text-purple-400" /></div>
                    <span>Technical Assessment Process</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="p-2 bg-white/10 rounded-xl"><ShieldCheck size={18} className="text-green-400" /></div>
                    <span>Verified Hiring Pipeline</span>
                </div>
            </div>

            <div className="mt-auto pt-10 border-t border-white/10">
                <p className="text-xs text-gray-500 font-medium">Powered by AI Proctoring & Global Assessment Engines.</p>
            </div>
        </div>

        {/* Right Side: Action */}
        <div className="p-12 lg:p-16 flex flex-col items-center justify-center text-center space-y-8 bg-white">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-gray-100 animate-pulse-subtle">
                <CheckCircle2 size={40} className="text-black" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ready to start?</h2>
                <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">Click below to consume your invitation and begin your recruitment journey.</p>
            </div>

            <button
                disabled={consuming}
                onClick={handleConsume}
                className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {consuming ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                {consuming ? "Initializing..." : "Register & Continue"}
            </button>

            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed">
                By continuing, you agree to our <span className="underline cursor-pointer hover:text-black">Terms of Service</span> and <span className="underline cursor-pointer hover:text-black">AI Ethics Policy</span>.
            </p>
        </div>
      </div>
    </div>
  );
}