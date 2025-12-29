import { NextRequest, NextResponse } from "next/server";

import prisma from "@/app/lib/db";
import { generateWithGemini } from "@/app/lib/llm";
import { queryResumeChunks } from "@/app/lib/pinecone";

export async function POST(req: NextRequest) {
  console.log("📩 [API] Received POST request to /api/interviews");

  try {
    const { userId, resumeId, jobRole, aiInterviewerId } = await req.json();
    console.log("🧾 Request body:", { userId, resumeId, jobRole, aiInterviewerId });

    if (!resumeId) {
      console.error("❌ Missing resumeId in request body");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("🛠️ Creating interview session in DB...");
    const session = await prisma.interviewSession.create({
      data: {
        userId,
        resumeId,
        jobRole,
        aiInterviewerId,
        status: "PENDING",
        questionQueue: [],
        transcript: [],
        scores: [],
      },
    });
    console.log("✅ Created interview session:", session.id);

    console.log("🔍 Fetching resume from DB...");
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) {
      console.error("❌ Resume not found:", resumeId);
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    console.log("📄 Resume found. Starting to fetch resume chunks...");
    const sections = [
      "skills and technologies",
      "projects and achievements",
      "education background",
      "work experience or internships",
      "certifications or extracurriculars",
    ];

    const sectionResults: Record<string, string> = {};
    for (const section of sections) {
      console.log(`🔎 Querying section: ${section}`);
      const chunks = await queryResumeChunks(resumeId, section, 5);
      console.log(`📦 Retrieved ${chunks.length} chunks for ${section}`);
      sectionResults[section] = chunks.map((c) => c.content).join("\n");
    }

    console.log("🧠 Generating interview questions with Gemini...");
    const prompt = `
You are an AI interviewer preparing questions for a candidate applying for a ${jobRole} position.

Here is their resume summary by section:

== SKILLS ==
${sectionResults["skills and technologies"]}

== PROJECTS ==
${sectionResults["projects and achievements"]}

== EDUCATION ==
${sectionResults["education background"]}

== EXPERIENCE ==
${sectionResults["work experience or internships"]}

== CERTIFICATIONS ==
${sectionResults["certifications or extracurriculars"]}

---

Generate 5–10 thoughtful interview questions that:
- Cover both technical and behavioral aspects
- Are directly based on the candidate's experiences and skills
- Include some questions about specific projects or achievements
- Avoid generic questions like "Tell me about yourself"

Output as valid JSON array of strings.
`;

    const rawQuestionsJson = await generateWithGemini(prompt);
    console.log("🧾 Raw Gemini response:", rawQuestionsJson);

    // 🧹 Clean up and parse safely
    const cleanedJson = rawQuestionsJson
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let questions;
    try {
      questions = JSON.parse(cleanedJson);
      console.log("✅ Parsed Gemini questions successfully:", questions);
    } catch (err) {
      console.error("❌ Failed to parse Gemini response:", cleanedJson);
      throw new Error("Gemini returned invalid JSON format.");
    }

    console.log("💾 Updating interview session with generated questions...");
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        questionQueue: questions,
        transcript: [
          {
            type: "intro",
            message: `Hello, I'm VirtuInterview AI, your virtual recruiter for ${jobRole}. I'll ask questions based on your resume to simulate a real interview.`,
          },
        ],
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    console.log("✅ Interview session updated successfully:", session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("💥 [ERROR in /api/interview/create]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
