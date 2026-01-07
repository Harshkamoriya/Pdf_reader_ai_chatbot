import { getInterviewStateService } from "@/modules/interview/service";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const state = await getInterviewStateService(id);
    return success(state);
  } catch (err: any) {
    console.error("[Interview State API Error]:", err);
    return failure(err.message || "Failed to fetch interview state", 500);
  }
}
