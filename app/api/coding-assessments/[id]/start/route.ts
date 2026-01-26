import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";


export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = "mock-user-id";
    const assessmentId = params.id;

    const assessment = await prisma.codingAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // ✅ ONLY PICK QUESTIONS WITH CONTENT
    const questions = await prisma.question.findMany({
      where: {
        difficulty: assessment.difficulty,
        content: {
          isNot: null,
        },
      },
      take: 3,
    });

    if (questions.length < 3) {
      return NextResponse.json(
        { error: "Not enough valid questions available" },
        { status: 400 }
      );
    }

    const session = await prisma.assessmentSession.create({
      data: {
        assessmentId,
        userId,
        endsAt: new Date(Date.now() + assessment.duration * 60 * 1000),
        status: "active",
        questions: {
          create: questions.map((q, i) => ({
            questionId: q.id,
            order: i,
          })),
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
