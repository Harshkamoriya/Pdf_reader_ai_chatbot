import Link from "next/link";

async function getSessions() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/candidate/interviews`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function CandidateDashboard() {
  const sessions = await getSessions();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Interviews</h1>

      <div className="space-y-3">
        {sessions.map((s: any) => (
          <Link
            key={s.id}
            href={`/candidate/interviews/${s.id}`}
            className="block border rounded p-4 hover:bg-gray-50"
          >
            <p className="font-medium">{s.jobRole}</p>
            <p className="text-sm text-gray-600">{s.company}</p>
            <p className="text-xs mt-1">Status: {s.status}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
