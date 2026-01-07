import { generateWithGemini } from "@/app/lib/llm";
import { success, failure } from "@/utils/response";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, description, count = 5, topics = [] } = await req.json();

    if (!title) return failure("Job title is required");

    const prompt = `
      You are an expert recruiter and technical interviewer. 
      Generate ${count} Multiple Choice Questions (MCQs) for a job titled "${title}".
      Job Description: ${description || "N/A"}
      ${topics.length > 0 ? `Focus on these topics: ${topics.join(", ")}.` : ""}
      
      Requirements:
      1. Each question must have exactly 4 options.
      2. Exactly one option must be correct.
      3. Format the response as a valid JSON array of objects.
      4. Each object should have: "text", "options" (array of 4 strings), and "correct" (index 0-3).
      
      ONLY return the JSON. No preamble. No code blocks.
    `;

    const responseText = await generateWithGemini(prompt);
    const questions = JSON.parse(responseText);

    return success(questions);
  } catch (err: any) {
    console.error("[AI Question Gen Error]:", err);
    return failure("Failed to generate questions. Please try again.");
  }
}
