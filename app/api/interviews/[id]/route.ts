// // Improved Backend: /app/api/interviews/[id]/route.ts
// import { NextResponse, NextRequest } from "next/server";
// import prisma from "@/app/lib/db";
// import { generateWithGemini } from "@/app/lib/llm";
// import { queryResumeChunks } from "@/app/lib/pinecone";
// import { updateSession, endInterview } from "@/app/lib/interviewUtils";

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const sessionId = params.id;
//   console.log("📩 Fetching transcript for session:", sessionId);

//   try {
//     const session = await prisma.interviewSession.findUnique({
//       where: { id: sessionId },
//       select: {
//         id: true,
//         resumeId: true,
//         questionQueue: true,
//         transcript: true,
//         scores: true,
//         status: true,
//         jobRole: true,
//       },
//     });

//     if (!session) {
//       console.warn("⚠️ Session not found:", sessionId);
//       return NextResponse.json({ error: "Session not found" }, { status: 404 });
//     }

//     console.log("✅ Transcript fetched for session:", sessionId);
//     return NextResponse.json(session);
//   } catch (err) {
//     console.error("❌ Error fetching session:", err);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const body = await req.json();
//   const { reply, start } = body;
//   console.log("📩 [POST /interviews/:id] called with:", {
//     reply,
//     start,
//     sessionId: params.id,
//   });

//   const session = await prisma.interviewSession.findUnique({
//     where: { id: params.id },
//   });
//   if (!session) {
//     console.error("❌ Invalid session:", params.id);
//     return NextResponse.json({ error: "Invalid session" }, { status: 400 });
//   }
//   console.log(session.resumeId, "resume.id wali id hai ye");

//   console.log("✅ Session found:", session.id);

//   let transcript = session.transcript as any[];
//   let questionQueue = session.questionQueue as any[]; // Assume this is initially populated with resume-based seed questions if needed
//   let scores = session.scores as any[];

//   const INTERVIEWER_TONE = `
// You are an experienced senior software engineer conducting a realistic technical interview for a ${session.jobRole} role. 
// Speak in a natural, conversational tone — keep questions concise (1-2 sentences), curious, and human-like, as if chatting with a colleague. 
// Avoid robotic phrases like "based on your resume" or "you mentioned". Focus on industry-relevant topics like problem-solving, architecture decisions, and real-world challenges.
// `;

//   if (start) {
//     if (session.status !== "PENDING") {
//       return NextResponse.json({ error: "Session already started" }, { status: 400 });
//     }
//     console.log("🗣️ Starting session...");
//     const introMessage = `Hello, I'm VirtuInterview AI, your virtual interviewer for the ${session.jobRole} role. We'll discuss your experiences, skills, and projects in a conversational way. To get started, could you briefly introduce yourself and your background?`;
//     transcript.push({ type: "intro", message: introMessage });
//     await prisma.interviewSession.update({
//       where: { id: params.id },
//       data: {
//         transcript,
//         status: "IN_PROGRESS",
//         startedAt: new Date(),
//       },
//     });
//     console.log("💾 Session started and updated");
//     return NextResponse.json({ success: true });
//   }

//   if (session.status !== "IN_PROGRESS") {
//     console.error("❌ Non-in-progress session:", params.id);
//     return NextResponse.json({ error: "Session not in progress" }, { status: 400 });
//   }

//   if (!reply) {
//     return NextResponse.json({ error: "Missing reply" }, { status: 400 });
//   }

//   const current = transcript.at(-1);
//   console.log("📝 Processing reply for current entry:", current.type);

//   if (current.type === "intro") {
//     // Handle candidate's introduction reply
//     console.log("🗣️ Handling candidate introduction...");
//     const sentimentPrompt = `Analyze the tone and confidence in this candidate's introduction for a ${session.jobRole} role:
// "${reply}". 
// Focus on industry context: Does it highlight relevant experiences or skills? 
// Respond with ONLY valid JSON (no extra text or code fences):
// { "sentiment": "Positive|Neutral|Negative", "toneSummary": "brief description (e.g., 'Confident and focused on key tech skills')", "confidenceScore": number (1-10) }`;

//     const rawSentiment = await generateWithGemini(sentimentPrompt);
//     const sentiment = JSON.parse(rawSentiment);
//     console.log("🧠 Intro sentiment analysis:", sentiment);

//     transcript.push({ type: "reply", reply, sentiment, timestamp: new Date().toISOString() });

//     // Analyze intro for technical terms and catchy phrases
//     const introAnalysisPrompt = `As a senior recruiter for ${session.jobRole}, extract key technical skills, technologies, projects, or standout phrases (e.g., "built scalable APIs", "optimized database queries") from this introduction: "${reply}". 
// Respond with ONLY valid JSON (no extra text or code fences): { "catchyPhrases": string[] }`;
//     const rawIntroAnalysis = await generateWithGemini(introAnalysisPrompt);
//     const introAnalysis = JSON.parse(rawIntroAnalysis);
//     console.log("🧠 Intro technical analysis:", introAnalysis);

//     // Generate first resume-based question dynamically, preferring intro mentions
//     const resumeChunks = await queryResumeChunks(session.resumeId, "Key skills, projects, and experiences from the resume.", 10);
//     const resumeContext = resumeChunks.map((c) => c.content).join("\n\n");
//     let firstQuestionPrompt = `${INTERVIEWER_TONE}
// Based on the resume context: "${resumeContext}". `;
//     if (introAnalysis.catchyPhrases.length > 0) {
//       firstQuestionPrompt += `
// The candidate's introduction highlighted: ${introAnalysis.catchyPhrases.join(", ")}.
// Ask one natural, industry-focused question to explore one of these areas deeper. 
// Make it conversational and relevant to real-world scenarios, e.g., "How did you handle scaling in that MERN project?" or "What trade-offs did you consider when using React hooks?"
// Respond with ONLY valid JSON (no extra text or code fences): { "question": string, "primaryKeywords": string[] (3-5 key terms expected in a strong answer) }`;
//     } else {
//       firstQuestionPrompt += `
// Generate an opening question targeting a core skill or project from the resume. 
// Focus on practical aspects like design choices or challenges, e.g., "Walk me through how you implemented authentication in your recent app."
// Respond with ONLY valid JSON (no extra text or code fences): { "question": string, "primaryKeywords": string[] (3-5 key terms expected in a strong answer) }`;
//     }
//     const rawFirstQuestion = await generateWithGemini(firstQuestionPrompt);
//     const next = JSON.parse(rawFirstQuestion);
//     transcript.push({ type: "question", message: next.question, primaryKeywords: next.primaryKeywords || [] });
//     console.log("➡️ First dynamic question generated:", next.question);

//     await updateSession(params.id, transcript, questionQueue, scores);
//     console.log("💾 Session updated after intro reply");
//     return NextResponse.json({ success: true });
//   }

//   // --- Regular reply to question or followup ---
//   const currentQuestion = current.message;
//   const { primaryKeywords = [] } = current;

//   console.log("📝 Recording candidate reply for question:", currentQuestion);
//   transcript.push({
//     type: "reply",
//     question: currentQuestion,
//     reply,
//     timestamp: new Date().toISOString(),
//   });

//   // --- RAG context from resume ---
//   console.log("📦 Querying resume chunks for context...");
//   const resumeChunks = await queryResumeChunks(
//     session.resumeId,
//     currentQuestion,
//     5
//   );
//   const resumeContext = resumeChunks.map((c) => c.content).join("\n\n");
//   console.log(
//     `📄 Retrieved ${resumeChunks.length} chunks for question context`
//   );

//   // --- Analyze answer quality ---
//   const analysisPrompt = `${INTERVIEWER_TONE}
// Evaluate the candidate's reply for a ${session.jobRole} role.
// Question: "${currentQuestion}"
// Expected keywords: ${JSON.stringify(primaryKeywords)}
// Resume context for verification: "${resumeContext}"
// Candidate reply: "${reply}"

// Assess factual accuracy against the resume (deduct for mismatches or exaggerations).
// Check relevance to industry practices (e.g., best practices in scaling, security).
// Note any new details for potential follow-ups (e.g., specific tools or challenges mentioned).

// Respond with ONLY valid JSON (no extra text or code fences):
// {
//   "correctness": number (1-10, based on accuracy and depth),
//   "relevance": number (1-10, based on alignment with question and industry standards),
//   "missingKeywords": string[] (unaddressed expected terms),
//   "isIDontKnow": boolean (true if reply indicates lack of knowledge),
//   "reason": string (concise explanation, 1-2 sentences),
//   "catchyPhrases": string[] (2-5 standout topics or phrases from reply for deeper probing),
//   "needsHint": boolean (true if minor gaps that a hint could address)
// }`;
//   console.log("🧠 Sending answer for analysis to Gemini...");
//   const analysis = JSON.parse(await generateWithGemini(analysisPrompt));
//   console.log("✅ Answer analysis result:", analysis);

//   // --- Sentiment + confidence ---
//   const sentimentPrompt = `Analyze the confidence and tone in this reply for a technical ${session.jobRole} interview: "${reply}". 
// Consider industry context: Does it demonstrate clear thinking under pressure? 
// Respond with ONLY valid JSON (no extra text or code fences):
// { "confidenceLevel": "High|Medium|Low", "confidenceScore": number (1-10) }`;
//   const sentiment = JSON.parse(await generateWithGemini(sentimentPrompt));
//   console.log("🧠 Confidence/sentiment analysis:", sentiment);

//   // --- Calculate composite score ---
//   const totalScore = Math.round(
//     (analysis.correctness + analysis.relevance + sentiment.confidenceScore) / 3
//   );
//   scores.push({
//     question: currentQuestion,
//     score: totalScore,
//     reason: analysis.reason,
//     sentiment,
//   });
//   console.log("📊 Total score for question:", totalScore);

//   // --- Decide next action ---
//   let needsFollowup = false;

//   if (analysis.isIDontKnow) {
//     const nextPrompt = `${INTERVIEWER_TONE}
// The candidate indicated they don't know the answer. 
// Respond empathetically and encouragingly, then smoothly transition to the next topic. 
// E.g., "That's alright—everyone has areas to grow. Let's shift to something else." 
// Respond as plain text (no JSON or code fences).`;
//     const msg = await generateWithGemini(nextPrompt);
//     transcript.push({ type: "encouragement", message: msg });
//     console.log("🧠 Encouragement message generated:", msg);
//     needsFollowup = true; // Proceed after encouragement
//   } else if (analysis.needsHint) {
//     const hintPrompt = `${INTERVIEWER_TONE}
// The reply missed or was unclear on ${analysis.missingKeywords.join(", ")}. 
// Provide a subtle, industry-realistic hint (e.g., referencing common practices) and ask for elaboration. 
// E.g., "In many teams, server-side rendering helps with SEO—how did that play into your decision?" 
// Respond as plain text (no JSON or code fences).`;
//     const msg = await generateWithGemini(hintPrompt);
//     transcript.push({ type: "hint_followup", message: msg });
//     console.log("🧠 Hint and follow-up generated:", msg);
//     needsFollowup = true;
//   } else if (analysis.missingKeywords.length > 0) {
//     const nextPrompt = `${INTERVIEWER_TONE}
// The reply overlooked key concepts: ${analysis.missingKeywords.join(", ")}. 
// Ask a targeted follow-up to probe understanding, linking to resume or reply details. 
// Focus on practical implications, e.g., "How would you integrate caching to improve that?" 
// Respond as plain text (no JSON or code fences).`;
//     const msg = await generateWithGemini(nextPrompt);
//     transcript.push({ type: "followup", message: msg });
//     console.log("🧠 Follow-up question generated for missing keywords:", msg);
//     needsFollowup = true;
//   } else if (sentiment.confidenceLevel === "Low") {
//     const nextPrompt = `${INTERVIEWER_TONE}
// The candidate's confidence seemed low. 
// Encourage them naturally and ask a gentle follow-up to clarify their thought process. 
// E.g., "That makes sense—could you expand on your approach to debugging that issue?" 
// Keep it supportive and conversational. Respond as plain text (no JSON or code fences).`;
//     const msg = await generateWithGemini(nextPrompt);
//     transcript.push({ type: "followup", message: msg });
//     console.log("🧠 Follow-up question generated for low confidence:", msg);
//     needsFollowup = true;
//   } else if (totalScore < 6) {
//     const nextPrompt = `${INTERVIEWER_TONE}
// The reply lacked depth or accuracy. 
// Ask a clarifying follow-up on the core concept, drawing from industry standards or resume context. 
// E.g., "In production environments, how would you handle error logging for that setup?" 
// Respond as plain text (no JSON or code fences).`;
//     const msg = await generateWithGemini(nextPrompt);
//     transcript.push({ type: "followup", message: msg });
//     console.log("🧠 Follow-up question generated for low score:", msg);
//     needsFollowup = true;
//   }

//   // --- Move to next question or end (only if no followup needed, or after encouragement) ---
//   if (!needsFollowup || analysis.isIDontKnow) {  // Proceed after encouragement or if no followup
//     // Generate next question dynamically: Prefer based on catchy phrases from reply, else fall back to resume
//     let nextQuestionPrompt = `${INTERVIEWER_TONE}`;
//     if (analysis.catchyPhrases.length > 0) {
//       nextQuestionPrompt += `
// The candidate's reply included standout details: ${analysis.catchyPhrases.join(", ")}. 
// Generate a natural follow-on question to explore one deeper, emphasizing real-world applications. 
// E.g., "What scalability challenges did you encounter with that database?" 
// `;
//     } else {
//       nextQuestionPrompt += `
// Build the next question conversationally, focusing on unexplored skills or projects from the resume. 
// Emphasize practical, industry scenarios like optimization, collaboration, or trade-offs. 
// E.g., "How do you typically structure your CI/CD pipelines?" 
// `;
//     }
//     nextQuestionPrompt += `
// Respond with ONLY valid JSON (no extra text or code fences): { "question": string, "primaryKeywords": string[] (3-5 key terms expected in a strong answer) }`;

//     const rawNextQuestion = await generateWithGemini(nextQuestionPrompt);
//     const next = JSON.parse(rawNextQuestion);

//     if (next.question) {  // Check if a question was generated (e.g., if queue/resume has more)
//       transcript.push({ type: "question", message: next.question, primaryKeywords: next.primaryKeywords || [] });
//       console.log("➡️ Next dynamic question generated:", next.question);
//     } else {
//       console.log("🏁 No more questions, ending interview...");
//       await endInterview(params.id, transcript, scores);
//       return NextResponse.json({ ended: true });
//     }
//   }

//   await updateSession(params.id, transcript, questionQueue, scores);
//   console.log("💾 Session updated successfully after reply");
//   return NextResponse.json({ success: true });
// }

// Improved Backend: /app/api/interviews/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/app/lib/db";
import { generateWithGemini } from "@/app/lib/llm";
import { queryResumeChunks } from "@/app/lib/pinecone";
import { updateSession, endInterview } from "@/app/lib/interviewUtils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  console.log("📩 Fetching transcript for session:", sessionId);

  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        resumeId: true,
        questionQueue: true,
        transcript: true,
        scores: true,
        status: true,
        jobRole: true,
      },
    });

    if (!session) {
      console.warn("⚠️ Session not found:", sessionId);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log("✅ Transcript fetched for session:", sessionId);
    return NextResponse.json(session);
  } catch (err) {
    console.error("❌ Error fetching session:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { reply, start } = body;
  console.log("📩 [POST /interviews/:id] called with:", {
    reply,
    start,
    sessionId: params.id,
  });

  const session = await prisma.interviewSession.findUnique({
    where: { id: params.id },
  });
  if (!session) {
    console.error("❌ Invalid session:", params.id);
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
  console.log(session.resumeId, "resume.id wali id hai ye");

  console.log("✅ Session found:", session.id);

  let transcript = session.transcript as any[];
  let questionQueue = session.questionQueue as any[]; // Assume this is initially populated with resume-based seed questions if needed
  let scores = session.scores as any[];

  const INTERVIEWER_TONE = `
You are an experienced senior software engineer conducting a realistic technical interview for a ${session.jobRole} role. 
Speak in a natural, conversational tone — keep questions concise (1-2 sentences), curious, and human-like, as if chatting with a colleague. 
Avoid robotic phrases like "based on your resume" or "you mentioned". Focus on industry-relevant topics like problem-solving, architecture decisions, and real-world challenges.
`;

  if (start) {
    if (session.status !== "PENDING") {
      return NextResponse.json({ error: "Session already started" }, { status: 400 });
    }
    console.log("🗣️ Starting session...");
    const introMessage = `Hello, I'm VirtuInterview AI, your virtual interviewer for the ${session.jobRole} role. We'll discuss your experiences, skills, and projects in a conversational way. To get started, could you briefly introduce yourself and your background?`;
    transcript.push({ type: "intro", message: introMessage });
    await prisma.interviewSession.update({
      where: { id: params.id },
      data: {
        transcript,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
    console.log("💾 Session started and updated");
    return NextResponse.json({ success: true });
  }

  if (session.status !== "IN_PROGRESS") {
    console.error("❌ Non-in-progress session:", params.id);
    return NextResponse.json({ error: "Session not in progress" }, { status: 400 });
  }

  if (!reply) {
    return NextResponse.json({ error: "Missing reply" }, { status: 400 });
  }

  const current = transcript.at(-1);
  console.log("📝 Processing reply for current entry:", current.type);

  if (current.type === "intro") {
    // Handle candidate's introduction reply
    console.log("🗣️ Handling candidate introduction...");
    const sentimentPrompt = `Analyze the tone and confidence in this candidate's introduction for a ${session.jobRole} role:
"${reply}". 
Focus on industry context: Does it highlight relevant experiences or skills? 
Respond with ONLY valid JSON (no extra text or code fences):
{ "sentiment": "Positive|Neutral|Negative", "toneSummary": "brief description (e.g., 'Confident and focused on key tech skills')", "confidenceScore": number (1-10) }`;

    const rawSentiment = await generateWithGemini(sentimentPrompt);
    const sentiment = JSON.parse(rawSentiment);
    console.log("🧠 Intro sentiment analysis:", sentiment);

    transcript.push({ type: "reply", reply, sentiment, timestamp: new Date().toISOString() });

    // Analyze intro for technical terms and catchy phrases
    const introAnalysisPrompt = `As a senior recruiter for ${session.jobRole}, extract key technical skills, technologies, projects, or standout phrases (e.g., "built scalable APIs", "optimized database queries") from this introduction: "${reply}". 
Respond with ONLY valid JSON (no extra text or code fences): { "catchyPhrases": string[] }`;
    const rawIntroAnalysis = await generateWithGemini(introAnalysisPrompt);
    const introAnalysis = JSON.parse(rawIntroAnalysis);
    console.log("🧠 Intro technical analysis:", introAnalysis);

    // Generate first resume-based question dynamically, preferring intro mentions
    const resumeChunks = await queryResumeChunks(session.resumeId, "Key skills, projects, and experiences from the resume.", 10);
    const resumeContext = resumeChunks.map((c) => c.content).join("\n\n");
    let firstQuestionPrompt = `${INTERVIEWER_TONE}
Based on the resume context: "${resumeContext}". `;
    if (introAnalysis.catchyPhrases.length > 0) {
      firstQuestionPrompt += `
The candidate's introduction highlighted: ${introAnalysis.catchyPhrases.join(", ")}.
Ask one natural, industry-focused question to explore one of these areas deeper. 
Make it conversational and relevant to real-world scenarios, e.g., "How did you handle scaling in that MERN project?" or "What trade-offs did you consider when using React hooks?"
Respond with ONLY valid JSON (no extra text or code fences): { "question": string, "primaryKeywords": string[] (3-5 key terms expected in a strong answer) }`;
    } else {
      firstQuestionPrompt += `
Generate an opening question targeting a core skill or project from the resume. 
Focus on practical aspects like design choices or challenges, e.g., "Walk me through how you implemented authentication in your recent app."
Respond with ONLY valid JSON (no extra text or code fences): { "question": string, "primaryKeywords": string[] (3-5 key terms expected in a strong answer) }`;
    }
    const rawFirstQuestion = await generateWithGemini(firstQuestionPrompt);
    const next = JSON.parse(rawFirstQuestion);
    transcript.push({ type: "question", message: next.question, primaryKeywords: next.primaryKeywords || [] });
    console.log("➡️ First dynamic question generated:", next.question);

    await updateSession(params.id, transcript, questionQueue, scores);
    console.log("💾 Session updated after intro reply");
    return NextResponse.json({ success: true });
  }

  // --- Regular reply to question or followup ---
  const currentQuestion = current.message;
  const { primaryKeywords = [] } = current;

  console.log("📝 Recording candidate reply for question:", currentQuestion);
  transcript.push({
    type: "reply",
    question: currentQuestion,
    reply,
    timestamp: new Date().toISOString(),
  });

  // --- RAG context from resume ---
  console.log("📦 Querying resume chunks for context...");
  const resumeChunks = await queryResumeChunks(
    session.resumeId,
    currentQuestion,
    5
  );
  const resumeContext = resumeChunks.map((c) => c.content).join("\n\n");
  console.log(
    `📄 Retrieved ${resumeChunks.length} chunks for question context`
  );

  // --- Analyze answer quality ---
  const analysisPrompt = `${INTERVIEWER_TONE}
Evaluate the candidate's reply for a ${session.jobRole} role.
Question: "${currentQuestion}"
Expected keywords: ${JSON.stringify(primaryKeywords)}
Resume context for verification: "${resumeContext}"
Candidate reply: "${reply}"

Assess factual accuracy against the resume (deduct for mismatches or exaggerations).
Check relevance to industry practices (e.g., best practices in scaling, security).
Note any new details for potential follow-ups (e.g., specific tools or challenges mentioned).

Respond with ONLY valid JSON (no extra text or code fences):
{
  "correctness": number (1-10, based on accuracy and depth),
  "relevance": number (1-10, based on alignment with question and industry standards),
  "missingKeywords": string[] (unaddressed expected terms),
  "isIDontKnow": boolean (true if reply indicates lack of knowledge),
  "reason": string (concise explanation, 1-2 sentences),
  "catchyPhrases": string[] (2-5 standout topics or phrases from reply for deeper probing),
  "needsHint": boolean (true if minor gaps that a hint could address)
}`;
  console.log("🧠 Sending answer for analysis to Gemini...");
  const analysis = JSON.parse(await generateWithGemini(analysisPrompt));
  console.log("✅ Answer analysis result:", analysis);

  // --- Sentiment + confidence ---
  const sentimentPrompt = `Analyze the confidence and tone in this reply for a technical ${session.jobRole} interview: "${reply}". 
Consider industry context: Does it demonstrate clear thinking under pressure? 
Respond with ONLY valid JSON (no extra text or code fences):
{ "confidenceLevel": "High|Medium|Low", "confidenceScore": number (1-10) }`;
  const sentiment = JSON.parse(await generateWithGemini(sentimentPrompt));
  console.log("🧠 Confidence/sentiment analysis:", sentiment);

  // --- Calculate composite score ---
  const totalScore = Math.round(
    (analysis.correctness + analysis.relevance + sentiment.confidenceScore) / 3
  );
  scores.push({
    question: currentQuestion,
    score: totalScore,
    reason: analysis.reason,
    sentiment,
  });
  console.log("📊 Total score for question:", totalScore);

  // --- Decide next action ---
  let needsFollowup = false;

  if (analysis.isIDontKnow) {
    const nextPrompt = `${INTERVIEWER_TONE}
The candidate indicated they don't know the answer. 
Respond empathetically and encouragingly, then smoothly transition to the next topic. 
E.g., "That's alright—everyone has areas to grow. Let's shift to something else." 
Respond as plain text (no JSON or code fences).`;
    const msg = await generateWithGemini(nextPrompt);
    transcript.push({ type: "encouragement", message: msg });
    console.log("🧠 Encouragement message generated:", msg);
    needsFollowup = true; // Proceed after encouragement
  } else if (analysis.needsHint) {
    const hintPrompt = `${INTERVIEWER_TONE}
The reply missed or was unclear on ${analysis.missingKeywords.join(", ")}. 
Provide a subtle, industry-realistic hint (e.g., referencing common practices) and ask for elaboration. 
E.g., "In many teams, server-side rendering helps with SEO—how did that play into your decision?" 
Respond as plain text (no JSON or code fences).`;
    const msg = await generateWithGemini(hintPrompt);
    transcript.push({ type: "hint_followup", message: msg });
    console.log("🧠 Hint and follow-up generated:", msg);
    needsFollowup = true;
  } else if (analysis.missingKeywords.length > 0) {
    const nextPrompt = `${INTERVIEWER_TONE}
The reply overlooked key concepts: ${analysis.missingKeywords.join(", ")}. 
Ask a targeted follow-up to probe understanding, linking to resume or reply details. 
Focus on practical implications, e.g., "How would you integrate caching to improve that?" 
Respond as plain text (no JSON or code fences).`;
    const msg = await generateWithGemini(nextPrompt);
    transcript.push({ type: "followup", message: msg });
    console.log("🧠 Follow-up question generated for missing keywords:", msg);
    needsFollowup = true;
  } else if (sentiment.confidenceLevel === "Low") {
    const nextPrompt = `${INTERVIEWER_TONE}
The candidate's confidence seemed low. 
Encourage them naturally and ask a gentle follow-up to clarify their thought process. 
E.g., "That makes sense—could you expand on your approach to debugging that issue?" 
Keep it supportive and conversational. Respond as plain text (no JSON or code fences).`;
    const msg = await generateWithGemini(nextPrompt);
    transcript.push({ type: "followup", message: msg });
    console.log("🧠 Follow-up question generated for low confidence:", msg);
    needsFollowup = true;
  } else if (totalScore < 6) {
    const nextPrompt = `${INTERVIEWER_TONE}
The reply lacked depth or accuracy. 
Ask a clarifying follow-up on the core concept, drawing from industry standards or resume context. 
E.g., "In production environments, how would you handle error logging for that setup?" 
Respond as plain text (no JSON or code fences).`;
    const msg = await generateWithGemini(nextPrompt);
    transcript.push({ type: "followup", message: msg });
    console.log("🧠 Follow-up question generated for low score:", msg);
    needsFollowup = true;
  }

  // --- Move to next question or end (only if no followup needed, or after encouragement) ---
  if (!needsFollowup || analysis.isIDontKnow) {  // Proceed after encouragement or if no followup
    // Generate next question dynamically: Prefer based on catchy phrases from reply, else fall back to resume
    let nextQuestionPrompt = `${INTERVIEWER_TONE}`;
    if (analysis.catchyPhrases.length > 0) {
      nextQuestionPrompt += `
The candidate's reply included standout details: ${analysis.catchyPhrases.join(", ")}. 
Generate a natural follow-on question to explore one deeper, emphasizing real-world applications. 
E.g., "What scalability challenges did you encounter with that database?" 
`;
    } else {
      nextQuestionPrompt += `
Build the next question conversationally, focusing on unexplored skills or projects from the resume. 
Emphasize practical, industry scenarios like optimization, collaboration, or trade-offs. 
E.g., "How do you typically structure your CI/CD pipelines?" 
`;
    }
    nextQuestionPrompt += `
Respond with ONLY valid JSON (no extra text or code fences): { "question": string, "primaryKeywords": string[] (3-5 key terms expected in a strong answer) }`;

    const rawNextQuestion = await generateWithGemini(nextQuestionPrompt);
    const next = JSON.parse(rawNextQuestion);

    if (next.question) {  // Check if a question was generated (e.g., if queue/resume has more)
      transcript.push({ type: "question", message: next.question, primaryKeywords: next.primaryKeywords || [] });
      console.log("➡️ Next dynamic question generated:", next.question);
    } else {
      console.log("🏁 No more questions, ending interview...");
      await endInterview(params.id, transcript, scores);
      return NextResponse.json({ ended: true });
    }
  }

  await updateSession(params.id, transcript, questionQueue, scores);
  console.log("💾 Session updated successfully after reply");
  return NextResponse.json({ success: true });
}