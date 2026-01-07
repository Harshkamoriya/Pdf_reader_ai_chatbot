import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { generateWithGemini } from "@/app/lib/llm";
import { queryResumeChunks } from "@/app/lib/pinecone";

export async function createInterviewSession({
  userId,
  resumeId,
  jobRole,
  aiInterviewerId,
}: {
  userId: string;
  resumeId: string;
  jobRole: string;
  aiInterviewerId?: string;
}) {
  console.log("🚀 [START] createInterviewSession triggered");
  console.log("📄 Params:", { userId, resumeId, jobRole, aiInterviewerId });

  if (!resumeId) throw new Error("❌ Missing resumeId");

  console.log("🧠 Creating initial interview session in DB...");
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

  console.log("📑 Fetching resume details...");
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) throw new Error("❌ Resume not found");
  console.log("✅ Resume found for:", resumeId);

  const sections = [
    "skills and technologies",
    "projects and achievements",
    "education background",
    "work experience or internships",
    "certifications or extracurriculars",
  ];

  const sectionResults: Record<string, string> = {};
  for (const section of sections) {
    console.log(`🔍 Querying Pinecone for section: ${section}`);
    const chunks = await queryResumeChunks(resumeId, section, 5);
    console.log(`📦 Retrieved ${chunks.length} chunks for ${section}`);
    sectionResults[section] = chunks.map((c) => c.content).join("\n");
  }

  console.log("🧾 Building Gemini prompt...");
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

Respond ONLY with a **raw JSON array of strings**, no extra text or code fences.
`;

  console.log("⚙️ Sending prompt to Gemini...");
  let questionsJson = await generateWithGemini(prompt);
  console.log("🧩 Raw Gemini response:", questionsJson);

  console.log("🧹 Cleaning Gemini output...");
  questionsJson = questionsJson
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  console.log("🧾 Cleaned Gemini output:", questionsJson);

  let questions: string[];
  try {
    questions = JSON.parse(questionsJson);
    console.log("✅ Parsed Gemini questions:", questions);
  } catch (err) {
    console.error("❌ Failed to parse Gemini JSON:", questionsJson);
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
          message: `Hello, I'm VirtuInterview AI, your virtual recruiter for ${jobRole}. I'll ask questions based on your resume.`,
        },
      ],
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });
  console.log("✅ Interview session updated successfully!");

  console.log("🏁 [END] createInterviewSession completed for session:", session.id);
  return session.id;
}

export async function GET(req: NextRequest) {
  try {
    console.log("📄 Fetching all users from DB...");
    const users = await prisma.user.findMany();
    console.log(`✅ Retrieved ${users.length} users`);

    return NextResponse.json({ status: 200, message: "users fetched successfully", data: users });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json({ error: error || "Internal Server Error" }, { status: 500 });
  }
}
