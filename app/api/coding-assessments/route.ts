import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { difficulty, duration, language, title } = await req.json();

    const assessment = await prisma.codingAssessment.create({
      data: {
        title: title || `Coding Assessment - ${difficulty}`,
        difficulty: difficulty || "medium",
        duration: parseInt(duration) || 90,
        language: language || "cpp",
      },
    });

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
    });
  } catch (error: any) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
