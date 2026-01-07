"use client";

import { useState } from "react";

export default function Invites({ params }: any) {
  const [email, setEmail] = useState("");

  async function sendInvite() {
    await fetch("/api/invites", {
      method: "POST",
      body: JSON.stringify({ jobId: params.jobId, email }),
    });

    alert("Invite sent");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Invite Candidate</h1>

      <input
        placeholder="Candidate email"
        className="border p-2 w-full mb-3"
        onChange={e => setEmail(e.target.value)}
      />

      <button
        onClick={sendInvite}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Send Invite
      </button>
    </div>
  );
}
