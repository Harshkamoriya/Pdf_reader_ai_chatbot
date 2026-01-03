import { redirect } from "next/navigation";

export default async function InterviewController({
  params,
}: {
  params: { sessionId: string };
}) {
  const res = await fetch(
    `/api/interviews/${params.sessionId}/state`,
    { cache: "no-store" }
  );

  const state = await res.json();

  if (state.sessionStatus === "ENDED") {
    redirect(`/candidate/interviews/${params.sessionId}/completed`);
  }

  const round = state.currentRound;

  if (!round) {
    redirect(`/candidate/interviews/${params.sessionId}/completed`);
  }

  switch (round.roundType) {
    case "OA":
      redirect(`/candidate/interviews/${params.sessionId}/oa`);
    case "TECHNICAL":
      redirect(`/candidate/interviews/${params.sessionId}/technical`);
    case "HR":
      redirect(`/candidate/interviews/${params.sessionId}/hr`);
    default:
      redirect(`/candidate/interviews/${params.sessionId}/completed`);
  }
}
