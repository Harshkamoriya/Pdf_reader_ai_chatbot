"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { div } from "framer-motion/client";
import { Upload } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

import AppHeader from "../_components/AppHeader";

interface Coach {
  id: number;
  name: string;
  img: string;
}

const Page = () => {
  const { isSignedIn, user } = useUser();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>("");
  const [selectedService, setSelectedService] = useState<null | {
    title: string;
    image: string;
  }>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const router = useRouter();

  const uploadResumeMutation = useUploadResume();

  const handleUpload = () => {
    if (!resumeFile) {
      toast.error("please select a resume file first");
      return;
    }
    uploadResumeMutation.mutate(resumeFile);
  };

  const handlecreate = async () => {
    const res = await axios.post(`/api/interviews`, {
      userId: "57f3dbc5-41b7-4b96-9ad7-e09e611d735f",
      resumeId: "029394bb-f22e-4e72-bbc1-edc1ffb93359 ",
      jobRole: "software-engineer",
      aiInterviewerId: "default-ai",
    });
    console.log("res of the handlecreate button " , res);
  };

  if (!isSignedIn) {
    router.push("/");
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Please login ...</p>
      </div>
    );
  }
  const coaches: Coach[] = [
    { id: 1, name: "Shraddha", img: "./shraddha.jpg" },
    { id: 2, name: "MarkZ", img: "./mark.jpg" },
    { id: 3, name: "ElonMusk", img: "./elon.jpg" },
  ];

  const services = [
  {
    title: "Coding Assessments",
    image: "./coding.jpg",
    type: "coding",
  },
  {
    title: "Practice MCQs",
    image: "./mcq.jpg",
    type: "mcq",
  },
  {
    title: "Mock Interview",
    image: "./interview.jpg",
    type: "interview",
  },
];




  // const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   console.log("inside handle change event");
  //   set(e.target.value);
  // };

  return (
    <div className=" min-h-screen w-full p-10 lg:px-32 xl:px-56 2xl:px-72">
      {/* Header */}
      <AppHeader />

      {/* Services Grid */}
<div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, idx) => (
          <div
            key={idx}
            className="flex cursor-pointer flex-col items-center rounded-xl bg-white p-4 text-center shadow-md transition-shadow hover:shadow-xl dark:bg-gray-800"
            onClick={() => {
  if (service.type === "interview") {
    setSelectedService(service); // open modal (existing flow)
  } else if (service.type === "coding") {
    router.push("/coding-assessments");
  } else if (service.type === "mcq") {
    router.push("/mcqs");
  }
}}

          >
          <p className="mt-1 text-sm text-gray-500">
  {service.type === "coding" && "DSA & Company-style problems"}
  {service.type === "mcq" && "OS, DBMS, CN, OOPS"}
  {service.type === "interview" && "AI-powered mock interviews"}
</p>
            <img
              src={service.image}
              alt={service.title}
              className="mb-4 h-24 w-24 object-contain transition-transform hover:scale-105"
            />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {service.title}
            </h3>
          </div>
        ))}
      </div>

      <Button
        onClick={() => {
          handlecreate();
        }}
      >
        create session
      </Button>

      {/* Previous sessions */}
      <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-2xl font-semibold">Your previous sessions</h1>
        </div>
        <div className="rounded-xl border-b-1 pb-4">
          <h1 className="text-xl font-bold">Feedback</h1>
          <div className="mt-2">
            <div className="xs:flex-wrap flex flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                You have no previous sessions right now
              </p>
              <Button
                className="transform cursor-pointer bg-white opacity-0 transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-200 hover:opacity-100"
                variant={"outline"}
              >
                view feedback
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedService && (
        <Dialog
          open={!!selectedService}
          onOpenChange={() => setSelectedService(null)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedService.title}</DialogTitle>
              <DialogDescription>
                Upload your resume to get a personalized AI interview
                experience.
              </DialogDescription>
            </DialogHeader>

            {/* Resume Upload */}
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Upload your Resume
              </label>

              <div
                className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:bg-gray-100"
                onClick={() => document.getElementById("resumeUpload")?.click()}
              >
                <Upload className="mb-2 h-8 w-8 text-gray-500" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag & drop your resume
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  (PDF or DOCX up to 5MB)
                </p>

                <input
                  type="file"
                  id="resumeUpload"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setResumeFile(file);
                      setResumeName(file.name);
                    }
                  }}
                />
              </div>

              {resumeName && (
                <p className="mt-2 text-center text-sm text-gray-700">
                  ✅ Uploaded: <span className="font-medium">{resumeName}</span>
                </p>
              )}
            </div>

            {/* Coach Selection */}
            <p className="mt-6 mb-2 text-sm text-gray-600">
              Select your AI Coach
            </p>
            <div className="flex flex-row items-center justify-evenly gap-4">
              {coaches.map((coach, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedCoach(coach)}
                  className={`transform cursor-pointer rounded-lg p-1 transition-transform hover:scale-105 ${
                    selectedCoach?.id === coach.id
                      ? "border-2 border-blue-500"
                      : "border border-gray-300"
                  }`}
                >
                  <img
                    src={coach.img}
                    alt="avatar image"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <p className="mt-2 mb-2 text-center text-gray-600">
                    {coach.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end">
              <div className="flex flex-row gap-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>

                <Button
                  disabled={
                    !resumeFile ||
                    !selectedCoach ||
                    uploadResumeMutation.isPending
                  }
                  onClick={handleUpload}
                  className={`rounded bg-blue-500 px-4 py-2 text-white transition ${
                    uploadResumeMutation.isPending
                      ? "cursor-wait opacity-70"
                      : "hover:bg-blue-600"
                  }`}
                >
                  {uploadResumeMutation.isPending ? "Uploading..." : "Next"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Page;
