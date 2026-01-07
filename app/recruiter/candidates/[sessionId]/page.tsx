"use client";

import { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MessageSquare,
  BarChart3,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function CandidateAnalyticsPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/interviews/${sessionId}/report`);
        const data = await res.json();
        if (data.success) {
          setReport(data.data);
          if (data.data.roundSessions.length > 0) {
            setSelectedRound(data.data.roundSessions[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [sessionId]);

  if (loading) return <div className="space-y-4 animate-pulse p-10">
    <div className="h-8 w-64 bg-gray-200 rounded" />
    <div className="h-40 bg-gray-200 rounded-2xl" />
    <div className="grid grid-cols-3 gap-4">
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="col-span-2 h-64 bg-gray-200 rounded-2xl" />
    </div>
  </div>;

  if (!report) return <div>Candidate data not found</div>;

  const currentRoundSession = report.roundSessions.find((rs: any) => rs.id === selectedRound);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{report.user?.name || "Candidate Registration Pending"}</h1>
          <p className="text-muted-foreground">{report.user?.email || "No email available"}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Overall Score</p>
            <h3 className="text-2xl font-bold">{report.finalScore || report.roundSessions.reduce((acc: number, rs: any) => acc + (rs.score || 0), 0) / report.roundSessions.length || 0}%</h3>
          </div>
        </div>
        <div className="p-6 bg-white border rounded-2xl flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            report.roundSessions.some((rs: any) => rs.cheatingScore > 5) ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          )}>
            {report.roundSessions.some((rs: any) => rs.cheatingScore > 5) ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Trust Score</p>
            <h3 className="text-2xl font-bold">{100 - (report.roundSessions.reduce((acc: number, rs: any) => acc + (rs.cheatingScore || 0), 0) * 2)}%</h3>
          </div>
        </div>
        <div className="p-6 bg-white border rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Status</p>
            <h3 className="text-2xl font-bold">{report.status}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Rounds Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground ml-2">Interview Rounds</h2>
          {report.roundSessions.map((rs: any) => (
            <button
              key={rs.id}
              onClick={() => setSelectedRound(rs.id)}
              className={cn(
                "w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between group",
                selectedRound === rs.id ? "bg-black border-black text-white shadow-lg" : "bg-white hover:border-gray-300"
              )}
            >
              <div>
                <p className="text-xs font-bold uppercase opacity-60 tracking-tighter">{rs.round.roundType}</p>
                <p className="font-semibold">{rs.status}</p>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs",
                selectedRound === rs.id ? "bg-white/20" : "bg-gray-100"
              )}>
                {rs.score || "--"}
              </div>
            </button>
          ))}
        </div>

        {/* Round Details */}
        <div className="lg:col-span-3 space-y-8">
          {currentRoundSession ? (
            <>
              <div className="bg-white border rounded-2xl p-8 space-y-8">
                <div className="flex items-center justify-between border-b pb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{currentRoundSession.round.roundType} Round Details</h2>
                    <p className="text-sm text-muted-foreground">Session held on {new Date(currentRoundSession.startedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-3xl font-bold">{currentRoundSession.score || 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Score</p>
                    </div>
                    <div className="text-center">
                        <p className={cn("text-3xl font-bold", currentRoundSession.cheatingScore > 5 ? "text-red-600" : "text-green-600 font-bold")}>
                            {currentRoundSession.cheatingScore || 0}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Violations</p>
                    </div>
                  </div>
                </div>

                {/* Transcript or Answers */}
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <MessageSquare size={18} /> Round Insights
                  </h3>
                  <div className="bg-gray-50 rounded-2xl p-6 min-h-[200px]">
                    {currentRoundSession.transcript ? (
                        <div className="space-y-4">
                            {/* Assuming transcript is an array of messages */}
                            {(currentRoundSession.transcript as any).map((msg: any, i: number) => (
                                <div key={i} className={cn("p-3 rounded-lg max-w-[80%]", msg.role === "assistant" ? "bg-white border ml-0" : "bg-black text-white ml-auto")}>
                                    <p className="text-xs font-bold mb-1 uppercase opacity-60">{msg.role}</p>
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm italic">No transcript available for this round yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Proctoring Timeline */}
              <div className="bg-white border rounded-2xl p-8 space-y-6">
                <h3 className="font-bold flex items-center gap-2">
                  <ShieldAlert size={18} /> Proctoring Logs
                </h3>
                <div className="space-y-4">
                  {currentRoundSession.proctoringEvents.length > 0 ? (
                    currentRoundSession.proctoringEvents.map((event: any, i: number) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                event.severity > 2 ? "bg-red-50 border-red-100 text-red-600" : "bg-orange-50 border-orange-100 text-orange-600"
                            )}>
                                <ShieldAlert size={18} />
                            </div>
                            <div className="w-0.5 flex-1 bg-gray-100 my-1 last:hidden" />
                        </div>
                        <div className="pb-8">
                            <p className="text-sm font-bold">{event.eventType.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleTimeString()} - Severity: {event.severity}</p>
                            {event.metadata && (
                                <pre className="mt-2 p-2 bg-gray-50 rounded text-[10px] text-gray-500 overflow-auto max-w-sm">
                                    {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-green-50/30 rounded-2xl border border-dashed border-green-200">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck size={24} />
                        </div>
                        <p className="text-sm font-semibold text-green-800">No violations detected</p>
                        <p className="text-xs text-green-600 mt-1 px-10 text-center">Candidate maintained focus throughout the session.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a round to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
