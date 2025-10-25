// 🚀 Improved createInterviewSession (generalized for any resume)
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
  console.log("📩 [createInterviewSession] called with:", {
    userId,
    resumeId,
    jobRole,
    aiInterviewerId,
  });

  if (!resumeId) {
    console.error("❌ Missing resumeId");
    throw new Error("Missing resumeId");
  }
    const INTERVIEWER_TONE = `
You are a calm, conversational senior software engineer conducting a technical interview. 
Ask naturally phrased questions — concise, curious, and human-like. 
Avoid robotic transitions like "you mentioned" or "based on your resume". 
Keep each question under 2 sentences.
`;

  // Create session
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

  // Fetch resume
  console.log("🔍 Fetching resume from DB...");
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume) {
    console.error("❌ Resume not found:", resumeId);
    throw new Error("Resume not found");
  }
  
  console.log("📄 Resume found:", resume.filename);
  console.log(resume.fullResumeText,"db resumefulltext")
  
  // Fetch all resume chunks to reconstruct full text
  console.log("🧩 Fetching all resume chunks from Pinecone...");
  const allChunks = await queryResumeChunks(resumeId, " ", 30);
  const fullResumeText = allChunks.map((c) => c.content).join("\n");

  console.log("full resume text", fullResumeText)
  if (!fullResumeText) {
    console.warn("⚠️ No resume content found in Pinecone for ID:", resumeId);
  }

  // 🧠 Step 1: Extract dynamic sections using Gemini
  console.log("🧠 Extracting sections dynamically with Gemini...");
  const sectionPrompt = `
You are an expert at analyzing resumes. Given the text below, categorize its content into the following standardized sections:
- Skills or Technologies
- Projects or Achievements
- Education
- Experience or Internships
- Certifications or Extracurriculars

Return only a clean JSON object mapping section names to their corresponding extracted text. 
Even if some sections are missing, include empty strings for them.

Example output:
{
  "skills": "...",
  "projects": "...",
  "education": "...",
  "experience": "...",
  "certifications": "..."
}

Resume Text:
${fullResumeText}
`;

  let sectionJson = await generateWithGemini(sectionPrompt);
  sectionJson = sectionJson.replace(/```json/g, "").replace(/```/g, "").trim();

  let sectionResults: Record<string, string>;
  try {
    sectionResults = JSON.parse(sectionJson);
    console.log("✅ Successfully extracted resume sections:", Object.keys(sectionResults));
        console.log("✅ Successfully extracted resume sections:", Object.values(sectionResults));

  } catch (err) {
    console.error("❌ Failed to parse Gemini JSON for section extraction:", sectionJson);
    throw new Error("Gemini returned invalid section JSON.");
  }

  console.log( "sectionresults are as follows ",sectionResults)

  // 🧠 Step 2: Generate technical interview questions
  const questionPrompt = `${INTERVIEWER_TONE}
You are a senior software engineer interviewing a candidate for a ${jobRole} position. 
Your goal is to generate technical questions that directly reference specific skills, projects, technologies, or experiences from the candidate's resume.

Here is the structured resume data:

== SKILLS ==
${sectionResults.skills || ""}

== PROJECTS ==
${sectionResults.projects || ""}

== EDUCATION ==
${sectionResults.education || ""}

== EXPERIENCE ==
${sectionResults.experience || ""}

== CERTIFICATIONS ==
${sectionResults.certifications || ""}

---

Generate 5–10 targeted technical questions that:
- Directly reference specific items from the resume (e.g., "You mentioned building a project with Next.js...")
- Probe technical depth, decision-making, or implementation details
- Include a mix of conceptual and project-related questions
- Avoid behavioral or generic questions
- For each question, include 3–5 primary keywords expected in a strong answer.

Respond ONLY with a raw JSON array of objects, no extra text or markdown:
[
  {"question": "Question text", "primaryKeywords": ["key1", "key2", "key3"]}
]
`;

  console.log("🧠 Sending prompt to Gemini for question generation...");
  let questionsJson = await generateWithGemini(questionPrompt);
  questionsJson = questionsJson.replace(/```json/g, "").replace(/```/g, "").trim();

  let questions: { question: string; primaryKeywords: string[] }[] = [];
  try {
    questions = JSON.parse(questionsJson);
    console.log("✅ Parsed Gemini questions successfully:", questions);
  } catch (err) {
    console.error("❌ Failed to parse Gemini JSON for questions:", questionsJson);
    throw new Error("Gemini returned invalid question JSON format.");
  }

  // 💾 Update session with generated questions
  console.log("💾 Updating interview session with generated questions...");
  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      questionQueue: questions,
    },
  });
  console.log("✅ Interview session updated successfully:", session.id);

  return session.id;
}
