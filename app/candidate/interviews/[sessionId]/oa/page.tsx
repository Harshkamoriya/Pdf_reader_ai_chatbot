
"use client";

import { useEffect, useState } from "react";

export default function OAPage({ params }: any) {
  const [questions, setQuestions] = useState([]);
  const [roundSessionId, setRoundSessionId] = useState("");

  useEffect(() => {
    fetch(`/api/interviews/${params.sessionId}/state`)
      .then(res => res.json())
      .then(state => {
        setRoundSessionId(state.currentRound.roundSessionId);
        return fetch(`/api/rounds/${state.currentRound.roundSessionId}/questions`);
      })
      .then(res => res.json())
      .then(data => setQuestions(data.questions));
  }, []);

  function submit() {
    fetch(`/api/rounds/${roundSessionId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers: [] }),
    }).then(() => {
      window.location.href = `/candidate/interviews/${params.sessionId}`;
    });
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Online Assessment</h2>

      {questions.map((q: any, i: number) => (
        <div key={i} className="mb-4">
          <p className="font-medium">{q.text}</p>
          {q.options.map((o: string) => (
            <label key={o} className="block">
              <input type="radio" /> {o}
            </label>
          ))}
        </div>
      ))}

      <button onClick={submit} className="mt-6 bg-black text-white px-5 py-2 rounded">
        Submit Assessment
      </button>
    </div>
  );
}
