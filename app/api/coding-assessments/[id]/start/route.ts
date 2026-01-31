import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🚀 Starting assessment...");

    // 1️⃣ Get user and assessment id
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assessmentId } = await context.params;
    console.log("Assessment ID:", assessmentId, "User ID:", userId);

    // 2️⃣ Fetch assessment
    const assessment = await prisma.codingAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      console.error("❌ Assessment not found");
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Normalize difficulty (medium → Medium)
    const normalizedDifficulty =
      assessment.difficulty.charAt(0).toUpperCase() +
      assessment.difficulty.slice(1).toLowerCase();

    // 4️⃣ Get questions already attempted by this user
    const attemptedQuestions = await prisma.codeSubmission.findMany({
      where: {
        session: {
          userId: userId,
        },
      },
      select: {
        questionId: true,
      },
    });

    const attemptedIds = new Set(attemptedQuestions.map((q) => q.questionId));
    console.log(`🔍 User has attempted ${attemptedIds.size} questions previously.`);

    // 5️⃣ Fetch all potential questions with content
    // We fetch more than we need to allow for random selection and filtering
    const allQuestions = await prisma.question.findMany({
      where: {
        difficulty: normalizedDifficulty,
        content: {
          isNot: null,
          is: {
            statement: { not: "" },
          },
        },
      },
      include: {
        content: true,
      },
    });

    console.log(`✅ Found ${allQuestions.length} total questions for ${normalizedDifficulty}`);

    // 6️⃣ Filter and Shuffle
    const unattemptedQuestions = allQuestions.filter((q) => !attemptedIds.has(q.id));
    
    // If we don't have enough unattempted questions, we might have to reuse some (optional logic)
    // For now, let's prioritize unattempted, but fallback to all if needed to reach 3.
    let pool = unattemptedQuestions.length >= 3 ? unattemptedQuestions : allQuestions;

    if (pool.length < 3) {
      // Fallback to any difficulty if still not enough? 
      // Or just return error if database is too small.
       return NextResponse.json(
        { error: "Not enough questions available in the database for this difficulty." },
        { status: 400 }
      );
    }

    // Shuffle logic
    const selectedQuestions = pool
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    console.log(
      "📦 Selected 3 random questions:",
      selectedQuestions.map(q => q.title)
    );

    // 7️⃣ Create assessment session
    const session = await prisma.assessmentSession.create({
      data: {
        assessmentId,
        userId,
        endsAt: new Date(
          Date.now() + assessment.duration * 60 * 1000
        ),
        status: "active",
        questions: {
          create: selectedQuestions.map((q, index) => ({
            questionId: q.id,
            order: index,
          })),
        },
      },
    });

    console.log("🎉 Session created:", session.id);

    // 8️⃣ Success response
    return NextResponse.json({
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("🔥 Start assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



