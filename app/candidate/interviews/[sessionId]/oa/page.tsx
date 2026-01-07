"use client";

import { useEffect, useRef, useState } from "react";
import { useProctoring } from "@/app/candidate/_proctoring/useProctoring";
import { useAdvancedProctoring } from "@/app/candidate/_proctoring/useAdvancedProctoring";
import { 
    Timer, 
    CheckCircle2, 
    AlertCircle,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OAPage({ params }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [roundSessionId, setRoundSessionId] = useState<string | null>(null);
  const [permissionsOk, setPermissionsOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const advancedProctor = useAdvancedProctoring(roundSessionId);

  // -------------------------
  // 1️⃣ Fetch round state
  // -------------------------
  useEffect(() => {
    fetch(`/api/interviews/${params.sessionId}/state`)
      .then(res => res.json())
      .then(state => {
        if (!state.currentRound?.roundSessionId) {
          throw new Error("Round not ready");
        }
        setRoundSessionId(state.currentRound.roundSessionId);
      })
      .catch(() => setError("Unable to start assessment"));
  }, [params.sessionId]);

  // -------------------------
  // 2️⃣ Check mic + camera
  // -------------------------
  useEffect(() => {
    if (!roundSessionId) return;

    async function checkMediaPermissions() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        // Stop tracks immediately (we only validate permission)
        stream.getTracks().forEach(track => track.stop());

        setPermissionsOk(true);
      } catch (err) {
        setError(
          "Camera and microphone access is required to start the assessment."
        );
      }
    }

    checkMediaPermissions();
  }, [roundSessionId]);

  // -------------------------
  // 3️⃣ Start proctoring + fullscreen + load questions
  // -------------------------
  useEffect(() => {
    if (!permissionsOk || !roundSessionId) return;

    // Start proctoring
    useProctoring(roundSessionId);

    // Enforce fullscreen
    document.documentElement.requestFullscreen().catch(() => {
      setError("Fullscreen permission is required to continue.");
    });

    // Fetch questions
    fetch(`/api/rounds/${roundSessionId}/questions`)
      .then(res => res.json())
      .then(data => {
          setQuestions(data.questions);
          setAnswers(new Array(data.questions.length).fill(-1));
      })
      .catch(() => setError("Failed to load questions"));
  }, [permissionsOk, roundSessionId]);

  useEffect(() => {
  if (!permissionsOk || !roundSessionId) return;
  if (!videoRef.current) return;

  advancedProctor.start(videoRef.current);
}, [permissionsOk, roundSessionId]);

  // -------------------------
  // Submit OA
  // -------------------------
  function submit() {
    if (!roundSessionId) return;

    fetch(`/api/rounds/${roundSessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }).then(() => {
      window.location.href = `/candidate/interviews/${params.sessionId}`;
    });
  }

  // -------------------------
  // UI STATES
  // -------------------------
  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        <h2 className="text-xl font-semibold mb-2">Assessment Blocked</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!permissionsOk) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold mb-2">
          Checking system requirements…
        </h2>
        <p>Please allow camera and microphone access.</p>
      </div>
    );
  }

  // -------------------------
  // OA UI (Premium Redesign)
  // -------------------------
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Header / Timer Bar */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-black font-black text-xl italic">A</span>
            </div>
            <div>
                <h1 className="font-bold tracking-tight">Technical Assessment</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Antigravity Proctoring Active</p>
            </div>
        </div>

        <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Time Remaining</span>
                <div className="flex items-center gap-2">
                    <Timer size={18} className="text-amber-500" />
                    <span className="text-xl font-mono font-black tabular-nums">14:59</span>
                </div>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Progress</span>
                <p className="font-bold text-sm">{answers.filter(a => a !== -1).length} / {questions.length}</p>
            </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-10 p-8">
        {/* Left: Proctoring / Info */}
        <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative group">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Live Feed</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Security Status</h4>
                    <div className="space-y-2">
                        {[
                            { label: "Identity Verified", ok: true },
                            { label: "Audio Monitoring", ok: true },
                            { label: "Tab Lock Active", ok: true }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-gray-400">{item.label}</span>
                                <CheckCircle2 size={14} className="text-green-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Warning
                </p>
                <p className="text-xs text-blue-200/70 leading-relaxed font-medium">
                    Do not exit fullscreen or switch tabs. All activity is logged and will influence your Trust Score.
                </p>
            </div>
        </aside>

        {/* Middle: Questions */}
        <main className="lg:col-span-3 space-y-6">
            {questions.map((q: any, i: number) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-10 hover:bg-white/[0.05] transition-all group">
                    <div className="flex items-start gap-8">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="text-lg font-black">{i + 1}</span>
                        </div>
                        <div className="space-y-8 flex-1">
                            <p className="text-xl font-medium leading-relaxed text-gray-200">{q.text}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((o: string, oi: number) => (
                                    <button 
                                        key={oi} 
                                        onClick={() => {
                                            const newAnswers = [...answers];
                                            newAnswers[i] = oi;
                                            setAnswers(newAnswers);
                                        }}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
                                            answers[i] === oi 
                                                ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.15)]" 
                                                : "bg-white/5 border-transparent hover:border-white/20 text-gray-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border",
                                            answers[i] === oi ? "bg-black text-white border-black" : "bg-white/10 border-white/10"
                                        )}>
                                            {String.fromCharCode(65 + oi)}
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-tight">{o}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={submit}
                disabled={answers.includes(-1)}
                className="w-full py-6 mt-10 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
            >
                Finalize & Submit Assessment
            </button>
        </main>
      </div>
    </div>
  );
}
