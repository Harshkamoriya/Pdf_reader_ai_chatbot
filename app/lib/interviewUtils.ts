// /app/lib/interviewUtils.ts

import prisma from "./db";
import { generateWithGemini } from "./llm";

interface ScoreEntry {
  question: string;
  score: number;
  reason: string;
  sentiment: "High" | "Medium" | "Low";
}

interface FinalReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

// helper type-casting function


/**
 * Generates a final interview report for a given session.
 * Handles fetching, summarizing, scoring, and database updates.
 */
export async function generateFinalInterviewReport(sessionId: string) {
  console.log("🧠 Generating final report for session:", sessionId);

  // ---------------------------
  // 1️⃣ Fetch Session
  // ---------------------------
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      jobRole: true,
      status: true,
      transcript: true,
      scores: true,
    },
  });

  if (!session) throw new Error("Session not found");
  if (session.status === "ENDED") throw new Error("Session already ended");

  // ---------------------------
  // 2️⃣ Safe casting
  // ---------------------------
  const transcript = Array.isArray(session.transcript)
    ? session.transcript
    : [];

  const scores = Array.isArray(session.scores)
    ? (session.scores as unknown as ScoreEntry[])
    : [];

  // ---------------------------
  // 3️⃣ Average Score
  // ---------------------------
  const avgScore =
    scores.length > 0
      ? scores.reduce((acc, s) => acc + (s.score ?? 0), 0) / scores.length
      : 0;

  // ---------------------------
  // 4️⃣ Generate Report via Gemini
  // ---------------------------
  const summaryPrompt = `
  You are an AI interviewer generating a final summary report for a candidate applying for the "${session.jobRole}" position.
  Below is the full transcript and scoring data:

  Transcript: ${JSON.stringify(transcript, null, 2)}
  Scores: ${JSON.stringify(scores, null, 2)}

  Please provide a concise JSON summary with the following fields:
  {
    "overallScore": number (0–10),
    "summary": string,
    "strengths": string[],
    "improvements": string[],
    "verdict": string("Hire" | "Maybe" | "No Hire")
  }
  `;

  const rawReport = await generateWithGemini(summaryPrompt);

  let finalReport: FinalReport;
  try {
    finalReport = JSON.parse(rawReport);
  } catch {
    finalReport = {
      overallScore: avgScore,
      summary:
        "Candidate performed reasonably well. Demonstrated fair understanding of core topics.",
      strengths: ["Good communication", "Logical reasoning"],
      improvements: ["Needs deeper project-level answers"],
      verdict:
        avgScore > 7 ? "Hire" : avgScore > 5 ? "Maybe" : "No Hire",
    };
  }

  // 5️⃣ Update Database
await prisma.interviewSession.update({
  where: { id: sessionId },
  data: {
    transcript: JSON.parse(JSON.stringify(transcript)),
    scores: JSON.parse(JSON.stringify(scores)),
    finalReport: JSON.parse(JSON.stringify(finalReport)),
    status: "ENDED",
    endedAt: new Date(),
  },
});



  console.log("✅ Interview ended for session:", sessionId);

  return {
    success: true,
    ended: true,
    report: finalReport,
  };
}


export async function updateSession(sessionId: string, transcript: any[], questionQueue: any[], scores: any[]) {
  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: { transcript, questionQueue, scores, updatedAt: new Date() },
  });
}

export async function endInterview(sessionId: string, transcript: any[], scores: any[]) {
  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      transcript,
      scores,
      status: 'ENDED',
      endedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}


