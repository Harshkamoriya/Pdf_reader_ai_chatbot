"use client";

import { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  ExternalLink,
  MoreVertical,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { InviteModal } from "@/components/recruiter/InviteModal";
import { cn } from "@/lib/utils";

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/pipeline`);
        const data = await res.json();
        if (data.success) {
          setJob(data.pipeline);
          setPipeline(data.pipeline.rounds);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jobId]);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-8 w-64 bg-gray-200 rounded" />
    <div className="h-64 bg-gray-200 rounded-2xl" />
  </div>;

  if (!job) return <div>Job not found</div>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground">{job.skills.join(" • ")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Mail size={16} /> Invite Candidates
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all">
            Edit Job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Pipeline Visualization */}
          <div className="bg-white border rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6">Internal Pipeline</h2>
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10" />
              <div className="flex justify-between">
                {pipeline?.map((round: any, i: number) => (
                  <div key={round.id} className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-wider">{round.roundType}</p>
                      <p className="text-[10px] text-muted-foreground">Weight: {round.weight}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Applicant List Mock */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Applicants (12)</h2>
              <div className="flex gap-2">
                {/* Search/Filter would go here */}
              </div>
            </div>
            <div className="bg-white border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Current Round</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Overall Score</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {/* Mock applicants */}
                  <ApplicantRow name="John Smith" email="john@example.com" round="OA" status="Completed" score="88%" />
                  <ApplicantRow name="Sarah Connor" email="sarah@example.com" round="Technical" status="In Progress" score="--" />
                  <ApplicantRow name="Mike Ross" email="mike@example.com" round="OA" status="Failed" score="42%" />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-black text-white rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Job Analytics</h3>
            <div className="space-y-6">
               <div className="flex justify-between items-end">
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold">78%</p>
               </div>
               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[78%] h-full bg-white rounded-full" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Avg Score</p>
                    <p className="text-xl font-bold">72</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Passed</p>
                    <p className="text-xl font-bold">9</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <h3 className="font-bold mb-4 text-sm">Requirements</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill: string) => (
                <span key={skill} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        jobId={jobId}
        jobTitle={job.title}
      />
    </div>
  );
}

function ApplicantRow({ name, email, round, status, score }: any) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-medium">{round}</span>
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
          status === "Completed" ? "bg-green-100 text-green-700" :
          status === "In Progress" ? "bg-blue-100 text-blue-700" :
          "bg-red-100 text-red-700"
        )}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="font-bold">{score}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
}
