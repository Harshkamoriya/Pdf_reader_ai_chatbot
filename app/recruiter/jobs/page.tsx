"use client";

import { useEffect, useState } from "react";
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Plus,
  Search,
  Users,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function JobsListPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        if (data.success) {
          setJobs(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  if (loading) return <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Jobs</h1>
          <p className="text-muted-foreground">Manage your open positions and track candidate progress.</p>
        </div>
        <Link 
          href="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          Post New Role
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-white border border-gray-100 p-2 rounded-xl">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search roles or skills..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
          />
        </div>
        <div className="hidden md:flex gap-1 border-l pl-4 pr-2">
            <button className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">All Jobs</button>
            <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">Open</button>
            <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">Closed</button>
        </div>
      </div>

      <div className="grid gap-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/recruiter/jobs/${job.id}`}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-black transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold group-hover:underline">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar size={14} /> Posted 2 days ago</span>
                      <span className="flex items-center gap-1 font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-[10px] font-semibold uppercase tracking-tight">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-8 md:border-l md:pl-8">
                 <div className="text-center">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Applicants</p>
                 </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold">4</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">In Process</p>
                 </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold">2</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Qualified</p>
                 </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold">No jobs yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1 line-clamp-2">
              Start your recruitment process by posting your first job opening.
            </p>
            <Link 
              href="/recruiter/jobs/new"
              className="mt-6 inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-sm font-bold"
            >
              Post First Job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
