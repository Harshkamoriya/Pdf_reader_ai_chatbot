import { getInterviewStateService } from "@/modules/interview/service";
import { redirect } from "next/navigation";

export default async function InterviewController({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  
  const state = await getInterviewStateService(sessionId);

  if (state.status === "ENDED" || state.isCompleted) {
    redirect(`/candidate/interviews/${sessionId}/completed`);
  }

  const round = state.currentRound;

  if (!round) {
    redirect(`/candidate/interviews/${sessionId}/completed`);
  }

  switch (round.roundType) {
    case "OA":
      redirect(`/candidate/interviews/${sessionId}/oa`);
    case "TECHNICAL":
      redirect(`/candidate/interviews/${sessionId}/technical`);
    case "HR":
      redirect(`/candidate/interviews/${sessionId}/hr`);
    default:
      redirect(`/candidate/interviews/${sessionId}/completed`);
  }
}
