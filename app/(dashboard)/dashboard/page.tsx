"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Upload, ArrowRight, Code, BookOpen, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import { useUploadResume } from "@/hooks/useUploadResume";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/app/components/ui/button";
// assuming shadcn/ui path
import { cn } from "@/lib/utils"; // if you have cn helper

import AppHeader from "../_components/AppHeader";

interface Coach {
  id: number;
  name: string;
  img: string;
}

const services = [
  {
    title: "Coding Assessments",
    description: "DSA & Company-style problems",
    icon: Code,
    image: "./coding.jpg",
    type: "coding",
    href: "/coding-assessments",
  },
  {
    title: "Practice MCQs",
    description: "OS, DBMS, CN, OOPS",
    icon: BookOpen,
    image: "./mcq.jpg",
    type: "mcq",
    href: "/mcqs",
  },
  {
    title: "Mock Interview",
    description: "AI-powered realistic interviews",
    icon: MessageSquare,
    image: "./interview.jpg",
    type: "interview",
  },
];

const coaches: Coach[] = [
  { id: 1, name: "Shraddha", img: "./shraddha.jpg" },
  { id: 2, name: "Mark", img: "./mark.jpg" },
  { id: 3, name: "Elon", img: "./elon.jpg" },
];

export default function DashboardPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>("");
  const [selectedService, setSelectedService] = useState<(typeof services)[0] | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  const uploadResumeMutation = useUploadResume();

  const handleUpload = () => {
    if (!resumeFile) {
      toast.error("Please select a resume file first");
      return;
    }
    uploadResumeMutation.mutate(resumeFile);
  };

  // Just for testing – replace with real logic later
  const handleCreateSession = async () => {
    try {
      const res = await axios.post("/api/interviews", {
        userId: user?.id ?? "demo-user",
        resumeId: "demo-resume-id",
        jobRole: "software-engineer",
        aiInterviewerId: selectedCoach ? `coach-${selectedCoach.id}` : "default-ai",
      });
      toast.success("Interview session created!");
      console.log("Session created:", res.data);
      // router.push(`/interview/${res.data.id}`); // example redirect
    } catch (err) {
      toast.error("Failed to create session");
      console.error(err);
    }
  };

  if (!isSignedIn) {
    router.push("/");
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-xl font-medium text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 xl:px-12">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Prepare smarter. Interview better. Land your dream role.
          </p>
        </motion.section>

        {/* Services Grid */}
        <section className="mb-20">
          <h2 className="mb-8 text-2xl font-semibold text-gray-900 dark:text-white">
            Choose your preparation mode
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <motion.div
                  key={service.type}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => {
                    if (service.type === "interview") {
                      setSelectedService(service);
                    } else if (service.href) {
                      router.push(service.href);
                    }
                  }}
                  className={cn(
                    "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/50",
                    service.type === "interview" && "hover:ring-2 hover:ring-blue-500/30"
                  )}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 dark:from-blue-950/30 dark:to-indigo-950/30">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {service.description}
                  </p>

                  <div className="mt-6 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                    {service.type === "interview" ? "Start preparation" : "Go to section"}
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Optional subtle background image */}
                  {service.image && (
                    <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 opacity-10 blur-sm transition-opacity group-hover:opacity-20">
                      <img src={service.image} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Quick Action – Create Session (demo) */}
        <div className="mb-20 flex justify-center">
          <Button
            onClick={handleCreateSession}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-6 text-lg font-medium shadow-lg hover:from-blue-700 hover:to-indigo-700"
          >
            Create New Interview Session
          </Button>
        </div>

        {/* Previous Sessions */}
        <section>
          <h2 className="mb-8 text-2xl font-semibold text-gray-900 dark:text-white">
            Your Previous Sessions
          </h2>

          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No previous sessions yet.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Complete your first mock interview to see feedback here.
            </p>
            <Button variant="outline" className="mt-6">
              View All Feedback
            </Button>
          </div>
        </section>
      </main>

      {/* Interview Modal – Improved UX */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader className="text-center sm:text-left">
              <DialogTitle className="text-2xl">{selectedService.title}</DialogTitle>
              <DialogDescription className="mt-2">
                Upload your resume to unlock a fully personalized AI-powered mock interview
                experience.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-6">
              {/* Resume Upload – nicer dropzone style */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Upload Resume (PDF or DOCX • max 5MB)
                </label>

                <div
                  className={cn(
                    "flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
                    resumeFile
                      ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20"
                      : "border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
                  )}
                  onClick={() => document.getElementById("resumeUpload")?.click()}
                >
                  <Upload
                    className={cn(
                      "mb-3 h-10 w-10",
                      resumeFile ? "text-green-600" : "text-gray-400"
                    )}
                  />
                  {!resumeFile ? (
                    <>
                      <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Click to upload or drag & drop
                      </p>
                      <p className="mt-1 text-sm text-gray-500">PDF or DOCX up to 5MB</p>
                    </>
                  ) : (
                    <p className="text-base font-medium text-green-700 dark:text-green-400">
                      Resume ready: {resumeName}
                    </p>
                  )}

                  <input
                    id="resumeUpload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File size exceeds 5MB limit");
                          return;
                        }
                        setResumeFile(file);
                        setResumeName(file.name);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Coach Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Choose your AI Interview Coach
                </label>

                <div className="grid grid-cols-3 gap-4">
                  {coaches.map((coach) => (
                    <motion.button
                      key={coach.id}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCoach(coach)}
                      className={cn(
                        "group flex flex-col items-center rounded-xl border p-4 transition-all",
                        selectedCoach?.id === coach.id
                          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/30 dark:bg-blue-950/30"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full shadow-md">
                        <img
                          src={coach.img}
                          alt={coach.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {coach.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button
                disabled={!resumeFile || !selectedCoach || uploadResumeMutation.isPending}
                onClick={() => {
                  handleUpload();
                  // You can chain handleCreateSession() after successful upload
                }}
                className="min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {uploadResumeMutation.isPending ? "Uploading..." : "Start Interview"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}