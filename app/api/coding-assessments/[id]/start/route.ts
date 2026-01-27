import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🚀 Starting assessment...");

    // 1️⃣ Get assessment id
    const { id: assessmentId } = await context.params;
    const userId = "mock-user-id";

    console.log("Assessment ID:", assessmentId);

    // 2️⃣ Fetch assessment
    const assessment = await prisma.codingAssessment.findUnique({
      where: { id: assessmentId },
    });

    console.log("Assessment:", assessment);

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

    console.log("Normalized difficulty:", normalizedDifficulty);

    // 4️⃣ Difficulty fallback map
    const REQUIRED_QUESTIONS = 3;

    const difficultyOrderMap: Record<string, string[]> = {
      Easy: ["Easy"],
      Medium: ["Medium", "Easy", "Hard"],
      Hard: ["Hard", "Medium"],
    };

    const difficultyOrder =
      difficultyOrderMap[normalizedDifficulty] || [
        "Easy",
        "Medium",
        "Hard",
      ];

    console.log("Difficulty fallback order:", difficultyOrder);

    // 5️⃣ Fetch questions with fallback
    let selectedQuestions: any[] = [];

    for (const diff of difficultyOrder) {
      if (selectedQuestions.length >= REQUIRED_QUESTIONS) break;

      const remaining = REQUIRED_QUESTIONS - selectedQuestions.length;

      console.log(`🔍 Fetching ${remaining} questions for: ${diff}`);

      const fetchedQuestions = await prisma.question.findMany({
        where: {
          difficulty: diff,
          content: {
            is: {
              statement: {
                not: "",
              },
            },
          },
        },
        include: {
          content: true,
        },
        take: remaining,
      });

      console.log(
        `✅ Found ${fetchedQuestions.length} questions for ${diff}`
      );

      selectedQuestions.push(...fetchedQuestions);
    }

    console.log(
      "📦 Total selected questions:",
      selectedQuestions.length
    );

    if (selectedQuestions.length < REQUIRED_QUESTIONS) {
      console.error("❌ Not enough valid questions even after fallback");
      return NextResponse.json(
        { error: "Not enough valid questions available" },
        { status: 400 }
      );
    }

    // 6️⃣ Create assessment session
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
    console.log("selectedQuestions", selectedQuestions)


    // 7️⃣ Success response
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



