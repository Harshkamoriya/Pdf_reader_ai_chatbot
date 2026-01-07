import prisma from "@/app/lib/db";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roundSessionId: string }> }
) {
  try {
    const { roundSessionId } = await params;
    const { answers } = await req.json();

    // 1. Update round session status
    const updatedSession = await prisma.roundSession.update({
      where: { id: roundSessionId },
      data: {
        status: "ENDED" as any,
        endedAt: new Date(),
      },
    });

    // 2. Potentially trigger scoring or move to next round
    // This is where BullMQ could come in.

    return success({ message: "Assessment submitted successfully", session: updatedSession });
  } catch (err: any) {
    console.error("[Submit Round Error]:", err);
    return failure("Failed to submit assessment", 500);
  }
}
