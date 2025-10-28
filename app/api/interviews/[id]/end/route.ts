import { NextRequest, NextResponse } from "next/server";
import { generateFinalInterviewReport } from "@/app/lib/interviewUtils";
import prisma from "@/app/lib/db";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ await the Promise

    const result = await generateFinalInterviewReport(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error ending interview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to end interview" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ await here too

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    if (!session.finalReport) {
      return NextResponse.json(
        { error: "Final report not yet generated" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, finalReport: session.finalReport },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error fetching final report:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch final report",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
