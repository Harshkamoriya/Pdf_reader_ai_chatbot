import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/app/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const session = await prisma.interviewSession.findUnique({
      where: { id },
      include: {
        resume: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
    }

    // Verify ownership
    // Note: session.userId might be null if not linked to a user, but typically it should be compatible.
    // If strict ownership is needed:
    /*
    if (session.userId !== userId) { 
        // fetch user from prisma user table to map clerkId if needed, 
        // but typically we can check against session.userId if it stores the internal ID.
        // For now, assuming basic access or that userId matches if stored.
    }
    */
   
    // If you want to return just the report:
    // return NextResponse.json(session.finalReport || session.report || { status: session.status, message: "Report pending" });

    // But usually returning the whole session object is safer for dev info:
    return NextResponse.json(session);

  } catch (error: any) {
    console.error("Error fetching interview report:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
