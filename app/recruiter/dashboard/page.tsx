"use client";

import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RecruiterDashboard() {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalCandidates: 0,
    assessmentsCompleted: 0,
    pendingInvites: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const jobsRes = await fetch("/api/jobs");
        const jobsData = await jobsRes.json();
        
        if (jobsData.success) {
          setRecentJobs(jobsData.data.slice(0, 5));
          setStats(prev => ({
            ...prev,
            activeJobs: jobsData.data.length
          }));
        }

        // Mocking other stats for now as endpoints might not be ready
        setStats(prev => ({
          ...prev,
          totalCandidates: 12, // Mock
          assessmentsCompleted: 8, // Mock
          pendingInvites: 4 // Mock
        }));
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your recruitment.</p>
        </div>
        <Link 
          href="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          Post a New Job
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Jobs" 
          value={stats.activeJobs} 
          icon={Briefcase} 
          trend="+2 this month"
        />
        <StatCard 
          title="Total Candidates" 
          value={stats.totalCandidates} 
          icon={Users} 
          trend="+5 today"
        />
        <StatCard 
          title="Completed Assessments" 
          value={stats.assessmentsCompleted} 
          icon={CheckCircle2} 
          trend="85% pass rate"
        />
        <StatCard 
          title="Pending Invites" 
          value={stats.pendingInvites} 
          icon={Clock} 
          trend="Action required"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Job Posts</h2>
            <Link href="/recruiter/jobs" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
              View all jobs <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/recruiter/jobs/${job.id}`}
                  className="group p-5 bg-white border rounded-xl hover:border-black transition-all flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold group-hover:underline">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.skills.join(" • ")}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">2 applicants</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 bg-white border border-dashed rounded-xl">
                <p className="text-muted-foreground">No jobs posted yet.</p>
                <Link href="/recruiter/jobs/new" className="text-black text-sm font-medium hover:underline mt-2 inline-block">
                  Create your first job
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Mock */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <div className="bg-white border rounded-xl p-5 space-y-6">
            <ActivityItem 
              text="John Doe completed Technical Round" 
              time="2 hours ago" 
              score="92/100"
            />
            <ActivityItem 
              text="New application for Senior Frontend" 
              time="5 hours ago" 
            />
            <ActivityItem 
              text="Invite sent to sarah@example.com" 
              time="Yesterday" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="p-6 bg-white border rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon size={20} className="text-gray-600" />
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
      </div>
    </div>
  );
}

function ActivityItem({ text, time, score }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-1 bg-black rounded-full" />
      <div className="flex-1">
        <p className="text-sm font-medium">{text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{time}</span>
          {score && (
            <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
              {score}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
