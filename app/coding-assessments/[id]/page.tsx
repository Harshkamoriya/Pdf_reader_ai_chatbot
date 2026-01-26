"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Code, ShieldCheck, UserCheck } from "lucide-react";

export default function AssessmentOverview({ params }: { params: { id: string } }) {
  const router = useRouter();

  const startAssessment = async () => {
    try {
      const res = await axios.post(`/api/coding-assessments/${params.id}/start`);
      router.push(`/coding-assessments/session/${res.data.sessionId}`);
    } catch (err) {
      console.error("Failed to start assessment", err);
      // TODO: show nice toast/notification in real app
      alert("Could not start the assessment. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Coding Assessment
          </h1>
          <p className="mt-3 text-xl text-slate-400">
            Prove your skills • 3 Questions • 90 Minutes • Proctored
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left - Info Card */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-7 shadow-xl">
              <h2 className="text-2xl font-semibold mb-5 flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" size={28} />
                Important Rules & Guidelines
              </h2>

              <div className="space-y-5 text-slate-300">
                <RuleItem icon={UserCheck}>
                  You must take this assessment alone in a quiet, private room with no other people present.
                </RuleItem>

                <RuleItem icon={AlertCircle}>
                  <strong>Webcam and screen recording will be active</strong> throughout the test. Your face and screen must remain visible at all times.
                </RuleItem>

                <RuleItem icon={Code}>
                  No external help is allowed — including AI tools (ChatGPT, Copilot, etc.), other people, search engines, pre-written code, or shared screens.
                </RuleItem>

                <RuleItem icon={Clock}>
                  The timer starts as soon as you begin and cannot be paused. 90 minutes total for all 3 questions.
                </RuleItem>

                <RuleItem icon={AlertCircle}>
                  Switching tabs, opening dev tools, taking screenshots, or using virtual machines may be flagged as suspicious behavior.
                </RuleItem>

                <RuleItem icon={ShieldCheck} last>
                  Any violation of these rules may result in automatic disqualification and/or flagging of your submission.
                </RuleItem>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 text-slate-300 text-sm">
              <p className="font-medium text-white mb-2">Technical Notes</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Use only the built-in code editor — no copy-paste from external sources</li>
                <li>Supported languages: JavaScript, TypeScript, Python, Java, C++, C#, Go (check assessment for exact list)</li>
                <li>Internet access is restricted to the assessment platform only</li>
                <li>Auto-save is enabled — but still save your work frequently</li>
              </ul>
            </div>
          </div>

          {/* Right - Start Card */}
          <div className="md:col-span-1">
            <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-7 sticky top-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-center">Ready to Start?</h3>

              <div className="space-y-6 mb-8">
                <StatItem icon={Clock} label="Duration" value="90 minutes" />
                <StatItem icon={Code} label="Questions" value="3" color="text-cyan-400" />
                <StatItem icon={ShieldCheck} label="Proctoring" value="Enabled" color="text-rose-400" />
              </div>

              <button
                onClick={startAssessment}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Start Assessment
              </button>

              <p className="text-center text-sm text-slate-500 mt-5">
                Once started, the timer cannot be paused
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleItem({
  icon: Icon,
  children,
  last = false,
}: {
  icon: any;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex gap-4 ${!last ? "pb-5 border-b border-slate-700" : ""}`}>
      <Icon className="text-slate-400 mt-1 flex-shrink-0" size={20} />
      <p>{children}</p>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color = "text-slate-300",
}: {
  icon: any;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon size={22} className="text-slate-400" />
        <span className="text-slate-400">{label}</span>
      </div>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}