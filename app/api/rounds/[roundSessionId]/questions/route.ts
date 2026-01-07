import prisma from "@/app/lib/db";
import { failure, success } from "@/utils/response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roundSessionId: string }> }
) {
  try {
    const { roundSessionId } = await params;

    // 1. Find the round session and its associated job
    const roundSession = await prisma.roundSession.findUnique({
      where: { id: roundSessionId },
      include: {
        round: true,
        interviewSession: {
          include: {
            job: {
              include: {
                assessments: true
              }
            }
          }
        }
      }
    });

    if (!roundSession) return failure("Round session not found", 404);

    const job = roundSession.interviewSession.job;
    if (!job) return failure("Job not found for this session", 404);

    // 2. Find the assessment for this job (assuming MCQ for OA)
    const assessment = job.assessments.find(a => a.type === "MCQ");
    
    if (!assessment) {
      return success({ questions: [] });
    }

    // 3. Return the questions from config
    const config = assessment.config as any;
    const questions = config.mcqs || [];

    return success({ questions });
  } catch (err: any) {
    console.error("[Fetch Questions Error]:", err);
    return failure("Failed to load questions", 500);
  }
}
