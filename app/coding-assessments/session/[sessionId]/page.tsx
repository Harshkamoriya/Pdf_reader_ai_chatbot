"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { ChevronDown, ChevronUp, Play, SendHorizontal } from "lucide-react";

type Question = {
  id: string;
  title: string;
  statement?: string;
  constraints?: string;
  examples?: string;
};

const supportedLanguages = [
  { id: "javascript", name: "JavaScript" },
  { id: "python", name: "Python" },
  { id: "cpp", name: "C++" },
  { id: "java", name: "Java" },
  { id: "go", name: "Go" },
];

const defaultTemplates: Record<string, string> = {
  javascript: `function solution(input) {\n  // Your code here\n  return result;\n}`,
  python: `def solution(input):\n    # Your code here\n    return result`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstring solution(string input) {\n    // Your code here\n    return result;\n}`,
  java: `class Solution {\n    public String solution(String input) {\n        // Your code here\n        return result;\n    }\n}`,
  go: `func solution(input string) string {\n    // Your code here\n    return result\n}`,
};

export default function IDEPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [codes, setCodes] = useState<Record<string, Record<string, string>>>({});
  const [language, setLanguage] = useState("cpp");
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("Click Run to test your code...");
  const [showDescription, setShowDescription] = useState(true); // collapsible on mobile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch logic (unchanged)
    axios
      .get(`/api/coding-assessments/session/${sessionId}`)
      .then((res) => {
        const qs = res.data.questions || [];
        setQuestions(qs);
        setEndsAt(new Date(res.data.endsAt).getTime());
        const sessLang = (res.data.language || "cpp").toLowerCase();
        setLanguage(sessLang);
        const initialCodes: any = {};
        qs.forEach((q: Question) => {
          initialCodes[q.id] = { [sessLang]: defaultTemplates[sessLang] || "// Start coding..." };
        });
        setCodes(initialCodes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Timer (unchanged)
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = endsAt - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00");
        alert("Time's up!");
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const currentQuestion = questions[activeIndex];
  const currentCode = codes[currentQuestion?.id]?.[language] ?? "";

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (currentQuestion && !codes[currentQuestion.id]?.[newLang]) {
      setCodes((prev) => ({
        ...prev,
        [currentQuestion.id]: { ...prev[currentQuestion.id], [newLang]: defaultTemplates[newLang] || "// Start coding..." },
      }));
    }
  };

  const runCode = () => {
    setConsoleOutput("Running...\n[Simulated output]\nTest case 1: Passed\nTest case 2: Passed");
  };

  const submitCode = async () => {
    // your submit logic
    alert("Submitted!");
  };

  if (loading || !currentQuestion) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-[#000] text-gray-300 font-['Segoe_UI',sans-serif]">
      {/* Top bar - LeetCode style */}
      <div className="bg-[#111] border-b border-[#222] px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="font-bold text-white">Assessment</span>
          <span className="text-yellow-400">|</span>
          <span className="text-gray-400">{timeLeft ? `Time: ${timeLeft}` : "Timed"}</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1 text-sm focus:outline-none focus:border-[#0a84ff]"
          >
            {supportedLanguages.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main content - responsive */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Description area - collapsible on mobile */}
        {showDescription && (
          <div className="lg:w-2/5 lg:border-r lg:border-[#222] bg-[#0a0a0a] overflow-y-auto p-4 lg:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h2 className="text-lg font-bold text-white">{currentQuestion.title}</h2>
              <button onClick={() => setShowDescription(false)} className="text-gray-400">
                <ChevronUp size={20} />
              </button>
            </div>

            <h1 className="text-xl lg:text-2xl font-bold text-white mb-4 hidden lg:block">
              {currentQuestion.title}
            </h1>

            <div className="prose prose-invert prose-sm max-w-none">
              <h3 className="text-base font-semibold mb-2">Problem</h3>
              <div className="whitespace-pre-wrap leading-relaxed mb-6">
                {currentQuestion.statement || "No statement available."}
              </div>

              <h3 className="text-base font-semibold mb-2">Constraints</h3>
              <pre className="bg-[#111] p-4 rounded border border-[#222] text-sm overflow-x-auto mb-6">
                {currentQuestion.constraints || "—"}
              </pre>

              <h3 className="text-base font-semibold mb-2">Examples</h3>
              <pre className="bg-[#111] p-4 rounded border border-[#222] text-sm font-mono whitespace-pre-wrap">
                {currentQuestion.examples || "No examples provided."}
              </pre>
            </div>
          </div>
        )}

        {/* Editor + Console area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar for mobile (show description toggle) */}
          {!showDescription && (
            <div className="lg:hidden bg-[#111] border-b border-[#222] px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => setShowDescription(true)}
                className="flex items-center gap-1 text-blue-400 text-sm"
              >
                <ChevronDown size={16} /> Show Description
              </button>
              <div className="text-sm text-gray-400">{currentQuestion.title}</div>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 bg-[#000]">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={currentCode}
              onChange={(value) =>
                setCodes((prev) => ({
                  ...prev,
                  [currentQuestion.id]: { ...prev[currentQuestion.id], [language]: value || "" },
                }))
              }
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Console / Test output */}
          <div className="h-48 lg:h-56 bg-[#0d1117] border-t border-[#222] p-4 overflow-y-auto text-sm font-mono">
            <div className="flex items-center justify-between mb-2 text-gray-400 text-xs">
              <span>Console</span>
              <span>Output</span>
            </div>
            <div>{consoleOutput}</div>
          </div>

          {/* Bottom buttons */}
          <div className="bg-[#111] border-t border-[#222] px-4 py-3 flex justify-end gap-3">
            <button
              onClick={runCode}
              className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] px-5 py-2 rounded text-sm font-medium transition"
            >
              <Play size={16} /> Run
            </button>
            <button
              onClick={submitCode}
              className="flex items-center gap-2 bg-[#0a84ff] hover:bg-[#388bfd] px-5 py-2 rounded text-sm font-medium transition"
            >
              <SendHorizontal size={16} /> Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


