"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";

export default function IDEPage({ params }: any) {
  const { sessionId } = params;

  const [questions, setQuestions] = useState<any[]>([]);
  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [endsAt, setEndsAt] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get(`/api/coding-assessments/session/${sessionId}`)
      .then((res) => {
        setQuestions(res.data.questions);
        setEndsAt(new Date(res.data.endsAt).getTime());
      })
      .catch(console.error);
  }, [sessionId]);

  // Timer
  useEffect(() => {
    if (!endsAt) return;

    const i = setInterval(() => {
      if (Date.now() > endsAt) {
        alert("Time up! Auto-submitting...");
        clearInterval(i);
      }
    }, 1000);

    return () => clearInterval(i);
  }, [endsAt]);

  const submit = async () => {
    const q = questions[active];
    await axios.post("/api/submission", {
      sessionId,
      questionId: q.id,
      code: codes[q.id] || "",
      language: "cpp",
    });
    alert("Submitted");
  };

  if (!questions.length) {
    return <div className="text-white p-10">Loading...</div>;
  }

  const q = questions[active];

  return (
    <div className="h-screen grid grid-cols-3 bg-[#0f0f0f] text-white">
      {/* QUESTION LIST */}
      <div className="border-r border-gray-800 p-4">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setActive(i)}
            className={`block w-full text-left p-2 rounded ${
              i === active ? "bg-gray-800" : ""
            }`}
          >
            {q.title}
          </button>
        ))}
      </div>

      {/* QUESTION + IDE */}
      <div className="col-span-2 flex flex-col h-screen">
        {/* QUESTION */}
        <div className="p-4 border-b border-gray-800 overflow-y-auto max-h-[40%]">
          <h2 className="text-lg font-semibold">{q.title}</h2>
          <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
            {q.statement}
          </p>

          <p className="mt-4 text-sm text-gray-400">
            <strong>Constraints:</strong>
            <br />
            {q.constraints}
          </p>

          <p className="mt-4 text-sm text-gray-400">
            <strong>Examples:</strong>
            <br />
            {q.examples}
          </p>
        </div>

        {/* EDITOR */}
        <div className="flex-1">
          <Editor
            height="100%"
            language="cpp"
            theme="vs-dark"
            value={codes[q.id] || ""}
            onChange={(v) =>
              setCodes({ ...codes, [q.id]: v || "" })
            }
          />
        </div>

        {/* SUBMIT */}
        <button
          onClick={submit}
          className="bg-blue-600 py-3 font-medium"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
