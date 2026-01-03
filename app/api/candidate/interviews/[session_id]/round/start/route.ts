import { getNextRoundId, startRound } from "@/modules/rounds/execution.service";


export async function POST(
  _: Request,
  { params }: { params: { session_id: string } }
) {
  const sessionId = params.session_id;
  
  // derivation logic
  const nextRoundId = await getNextRoundId(sessionId);

  if (!nextRoundId) {
    return Response.json({ success: false, message: "No more rounds to start" }, { status: 400 });
  }

  const roundSession = await startRound(
    sessionId,
    nextRoundId
  );

  return Response.json({ success: true, roundSession });
}
