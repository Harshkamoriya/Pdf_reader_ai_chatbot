"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ArrowLeft, 
  Check,
  Briefcase,
  Layers,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Round = {
  roundType: string;
  order: number;
  weight: number;
  config: any;
};

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Job Info
  const [jobInfo, setJobInfo] = useState({
    title: "",
    description: "",
    skills: "",
  });

  // Step 2: Pipeline
  const [rounds, setRounds] = useState<Round[]>([
    { roundType: "OA", order: 1, weight: 30, config: {} },
    { roundType: "TECHNICAL", order: 2, weight: 40, config: {} },
    { roundType: "HR", order: 3, weight: 30, config: {} },
  ]);

  const [customRoundName, setCustomRoundName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Step 3: OA Config (Initial)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [oaConfig, setOaConfig] = useState({
    mcqs: [{ text: "", options: ["", "", ""], correct: 0 }],
  });

  const availableTopics = ["Aptitude", "DSA", "CS Fundamentals", "Web Development", "General Knowledge", "Problem Solving"];

  const addRound = (type: string) => {
    setRounds([...rounds, { roundType: type, order: rounds.length + 1, weight: 0, config: {} }]);
    setCustomRoundName("");
    setShowCustomInput(false);
  };

  const removeRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const generateAIQuestions = async () => {
    if (!jobInfo.title) {
        toast.error("Please enter a job title first");
        return;
    }
    setIsGenerating(true);
    try {
        const res = await fetch("/api/ai/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title: jobInfo.title, 
                description: jobInfo.description,
                topics: selectedTopics 
            }),
        });
        const data = await res.json();
        if (data.success) {
            setOaConfig({ mcqs: data.data });
            toast.success("Questions generated successfully!");
        } else {
            throw new Error(data.message);
        }
    } catch (err) {
        console.error(err);
        toast.error("Failed to generate questions. Try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!jobInfo.title || !jobInfo.description) {
        toast.error("Job title and description are required");
        return;
    }

    setLoading(true);
    try {
      // 1. Create Job
      const jobRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobInfo.title,
          description: jobInfo.description,
          skills: jobInfo.skills.split(",").map(s => s.trim()).filter(s => s !== ""),
          companyId: "mock-company-id", // Later from auth
        }),
      });
      const jobData = await jobRes.json();
      if (!jobData.success) {
        toast.error(jobData.message || "Job creation failed");
        setLoading(false);
        return;
      }

      const jobId = jobData.data.id;

      // 2. Create Rounds
      const roundsRes = await fetch(`/api/jobs/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rounds),
      });
      const roundsData = await roundsRes.json();
      if (!roundsData.success) {
          toast.error("Failed to create interview rounds");
          setLoading(false);
          return;
      }

      // 3. Create Assessment if OA exists
      if (rounds.some(r => r.roundType === "OA")) {
        const assessmentRes = await fetch(`/api/jobs/${jobId}/assessments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "MCQ",
            config: oaConfig,
          }),
        });
        const assessmentData = await assessmentRes.json();
        if (!assessmentData.success) {
            toast.error("Failed to save assessment questions");
            setLoading(false);
            return;
        }
      }

      toast.success("Job launched successfully!");
      router.push(`/recruiter/jobs/${jobId}`);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">Create New Job</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 px-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10" />
        <StepIcon step={1} current={step} icon={Briefcase} label="Job Info" />
        <StepIcon step={2} current={step} icon={Layers} label="Pipeline" />
        <StepIcon step={3} current={step} icon={FileText} label="Assessment" />
      </div>

      <div className="bg-white border rounded-2xl p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Job Title *</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                value={jobInfo.title}
                onChange={e => setJobInfo({...jobInfo, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Description *</label>
              <textarea 
                rows={5}
                placeholder="Describe the role and responsibilities..."
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                value={jobInfo.description}
                onChange={e => setJobInfo({...jobInfo, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Required Skills (Comma separated)</label>
              <input 
                type="text" 
                placeholder="React, Typescript, Node.js"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                value={jobInfo.skills}
                onChange={e => setJobInfo({...jobInfo, skills: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium">
                <AlertCircle size={16} />
                <span>Job details help AI generate more relevant assessment questions.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
              Design the interview process. Candidates must pass each round to proceed.
            </p>
            <div className="space-y-3">
              {rounds.map((round, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 border rounded-xl group transition-all">
                  <GripVertical size={18} className="text-gray-400 cursor-grab" />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Round {i+1}</span>
                    <p className="font-semibold text-sm">{round.roundType}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Weight</span>
                      <input 
                        type="number" 
                        className="w-10 text-sm font-bold bg-transparent border-none p-0 focus:ring-0 outline-none"
                        value={round.weight}
                        onChange={e => {
                          const newRounds = [...rounds];
                          newRounds[i].weight = parseInt(e.target.value) || 0;
                          setRounds(newRounds);
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground font-bold">%</span>
                    </div>
                    <button 
                      onClick={() => removeRound(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                {["OA", "TECHNICAL", "DSA", "HR"].map((type) => (
                  <button
                    key={type}
                    onClick={() => addRound(type)}
                    className="px-4 py-2 bg-gray-100 hover:bg-black hover:text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> {type}
                  </button>
                ))}
                {!showCustomInput && (
                    <button 
                        onClick={() => setShowCustomInput(true)}
                        className="px-4 py-2 bg-gray-100 hover:bg-black hover:text-white text-sm font-bold rounded-lg transition-all border-2 border-dashed border-gray-300"
                    >
                        <Plus size={14} /> Custom
                    </button>
                )}
              </div>
              
              {showCustomInput && (
                  <div className="mt-4 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text"
                        placeholder="Enter round name (e.g. Product Design)"
                        className="flex-1 p-2 bg-gray-50 border rounded-lg outline-none focus:ring-1 focus:ring-black text-sm"
                        value={customRoundName}
                        onChange={e => setCustomRoundName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && customRoundName && addRound(customRoundName)}
                      />
                      <button 
                        onClick={() => customRoundName && addRound(customRoundName)}
                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg"
                      >
                          Add
                      </button>
                      <button onClick={() => setShowCustomInput(false)} className="text-xs text-muted-foreground hover:underline px-2">Cancel</button>
                  </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-6 mb-6">
                <div>
                   <h3 className="font-bold text-lg">Questionnaire Builder</h3>
                   <p className="text-xs text-muted-foreground">Define the questions for the Online Assessment round.</p>
                </div>
                <button 
                  disabled={isGenerating}
                  onClick={generateAIQuestions}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:bg-purple-700 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin text-white/50" /> : <Sparkles size={14} />}
                  {isGenerating ? "AI Processing..." : "Generate with AI"}
                </button>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Topics for AI Focus</label>
                <div className="flex flex-wrap gap-2">
                    {availableTopics.map(topic => (
                        <button 
                            key={topic}
                            onClick={() => {
                                setSelectedTopics(prev => 
                                    prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
                                );
                            }}
                            className={cn(
                                "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border-2 transition-all",
                                selectedTopics.includes(topic) 
                                    ? "bg-purple-50 border-purple-600 text-purple-700" 
                                    : "bg-gray-50 border-transparent text-gray-400 hover:border-gray-200"
                            )}
                        >
                            {topic}
                        </button>
                    ))}
                </div>
            </div>

            {oaConfig.mcqs.map((mcq, i) => (
              <div key={i} className="p-6 border rounded-2xl space-y-4 group relative hover:border-black transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded tracking-widest">QUESTION {i+1}</span>
                  <button 
                    onClick={() => {
                        const newMcqs = oaConfig.mcqs.filter((_, idx) => idx !== i);
                        setOaConfig({ mcqs: newMcqs });
                    }}
                    className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Question text..."
                  className="w-full p-3 border-b border-gray-100 focus:border-black outline-none transition-colors font-medium"
                  value={mcq.text}
                  onChange={e => {
                    const newMcqs = [...oaConfig.mcqs];
                    newMcqs[i].text = e.target.value;
                    setOaConfig({mcqs: newMcqs});
                  }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {mcq.options.map((opt, oi) => (
                    <div key={oi} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        mcq.correct === oi ? "bg-black/5 border-black" : "bg-gray-50 border-transparent hover:border-gray-200"
                    )}>
                      <input 
                        type="radio" 
                        id={`q${i}o${oi}`}
                        name={`q${i}`}
                        className="accent-black"
                        checked={mcq.correct === oi}
                        onChange={() => {
                          const newMcqs = [...oaConfig.mcqs];
                          newMcqs[i].correct = oi;
                          setOaConfig({mcqs: newMcqs});
                        }}
                      />
                      <input 
                        type="text" 
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium pr-2"
                        value={opt}
                        onChange={e => {
                          const newMcqs = [...oaConfig.mcqs];
                          newMcqs[i].options[oi] = e.target.value;
                          setOaConfig({mcqs: newMcqs});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button 
              onClick={() => setOaConfig({mcqs: [...oaConfig.mcqs, { text: "", options: ["", "", "", ""], correct: 0 }]})}
              className="w-full py-4 border-2 border-dashed rounded-2xl text-muted-foreground hover:text-black hover:border-black transition-all font-bold text-sm flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Manual Question
            </button>
          </div>
        )}

        <div className="mt-12 flex items-center justify-between pt-8 border-t">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-black disabled:opacity-0 transition-all"
          >
            ← Previous
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            disabled={loading}
            className="px-10 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : step === 3 ? "Launch Job" : "Next Step"}
            {step < 3 && !loading && <Check size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ step, current, icon: Icon, label }: any) {
  const isCompleted = current > step;
  const isActive = current === step;

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300",
        isCompleted ? "bg-black border-black text-white" : 
        isActive ? "border-black bg-white text-black shadow-lg scale-110" : 
        "bg-white border-gray-100 text-gray-300"
      )}>
        {isCompleted ? <Check size={20} /> : <Icon size={20} />}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest",
        isCompleted || isActive ? "text-black" : "text-gray-300"
      )}>{label}</span>
    </div>
  );
}
