"use client";

import { useEffect, useState } from "react";

export default function OARound({ params }: any) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetch(`/api/rounds/${params.sessionId}/questions`)
      .then(res => res.json())
      .then(setQuestions);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Online Assessment</h2>

      {questions.map((q: any, idx: number) => (
        <div key={idx} className="mt-4">
          <p>{q.question}</p>
          {q.options.map((o: string) => (
            <label key={o} className="block">
              <input type="radio" name={`q-${idx}`} /> {o}
            </label>
          ))}
        </div>
      ))}

      <button className="mt-6 bg-black text-white px-4 py-2 rounded">
        Submit Assessment
      </button>
    </div>
  );
}
