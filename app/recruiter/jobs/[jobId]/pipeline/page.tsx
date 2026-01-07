"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PipelineBuilder({ params }: any) {
  const router = useRouter();
  const [rounds, setRounds] = useState<any[]>([]);

  function addRound(type: string) {
    setRounds([
      ...rounds,
      { roundType: type, order: rounds.length + 1, weight: 0.25, config: {} },
    ]);
  }

  async function savePipeline() {
    await fetch(`/api/jobs/${params.jobId}/rounds`, {
      method: "POST",
      body: JSON.stringify(rounds),
    });

    router.push(`/recruiter/jobs/${params.jobId}/assessment`);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Configure Interview Pipeline</h1>

      <div className="space-y-3">
        {rounds.map((r, i) => (
          <div key={i} className="border p-3 rounded">
            {i + 1}. {r.roundType}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => addRound("OA")} className="border px-3 py-1">+ OA</button>
        <button onClick={() => addRound("TECHNICAL")} className="border px-3 py-1">+ Technical</button>
        <button onClick={() => addRound("HR")} className="border px-3 py-1">+ HR</button>
      </div>

      <button
        onClick={savePipeline}
        className="mt-6 bg-black text-white px-4 py-2 rounded"
      >
        Save Pipeline
      </button>
    </div>
  );
}
