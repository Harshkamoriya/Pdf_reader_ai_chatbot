

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(req: NextRequest) {
  const { sessionId, questionId, code, language } = await req.json();

  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || new Date() > session.endsAt) {
    return NextResponse.json({ error: "Session expired" }, { status: 403 });
  }

  // Dummy evaluation (replace later)
  const status = code.length > 20 ? "passed" : "failed";
  const score = status === "passed" ? 100 : 0;

  await prisma.codeSubmission.create({
    data: {
      sessionId,
      questionId,
      code,
      language,
      status,
      score,
    },
  });

  return NextResponse.json({ status, score });
}
