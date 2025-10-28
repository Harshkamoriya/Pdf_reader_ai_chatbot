import { NextResponse, NextRequest } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedTextWithGemini } from "@/app/lib/gemini";
import prisma from "@/app/lib/db";
import { pdf } from "pdf-parse"; // ✅ correct import syntax
import { getAuth } from "@clerk/nextjs/server";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { createInterviewSession } from "@/app/lib/interviewSession";

export async function POST(req: NextRequest) {
  console.log("🟢 [UPLOAD ROUTE] Request received at:", new Date().toISOString());
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1️⃣ Check if user exists in DB
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    console.log("📦 FormData keys:", Array.from(formData.keys()));

    const file = formData.get("resume") as File;
    if (!file) throw new Error("No file uploaded — missing 'resume' key.");

    console.log("📄 File received:", file.name, "Size:", file.size, "Type:", file.type);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ Parse PDF
    console.log("🔍 Parsing PDF...");
    const pdfData = await pdf(buffer);
    const fullText = pdfData.text?.trim();
    console.log("📜 Extracted text length:", fullText.length);
    console.log("full text of resume in the upload section", fullText);

    if (!fullText || fullText.length < 50) {
      console.warn("⚠️ PDF text extraction seems too short or empty.");
    }

    // ✅ Chunk text
    console.log("✂️ Splitting text into chunks...");
    const CHUNK_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
      chunks.push(fullText.slice(i, i + CHUNK_SIZE));
    }
    console.log(`🧩 Total chunks created: ${chunks.length}`);

    // ✅ Create document in DB
    console.log("🗃️ Creating document record in Prisma...");
    const document = await prisma.document.create({
      data: {
        title: file.name || "Untitled Document",
        fileUrl: "",
        userId: user.id, // 👈 Use DB user ID
      },
    });

    console.log("✅ Document created with ID:", document.id);

    // ✅ Save file locally
    const resumeId = uuidv4();
    const uploadsDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, `${resumeId}.pdf`);

    console.log("💾 Saving PDF to:", filePath);
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    console.log("✅ File saved successfully.");

    // ✅ Create Resume record
    console.log(resumeId, "resume id");
    console.log("🗂️ Creating resume record in Prisma...");
    const resume = await prisma.resume.create({
      data: {
        id: resumeId,
        userId: user.id, // 👈 Use DB user ID
        filePath,
        fullResumeText: fullText,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });

    console.log("✅ Resume saved with ID:", resume.id);
    console.log(resumeId, "id from uuid");

    // ✅ Initialize Pinecone
    console.log("🌲 Initializing Pinecone client...");
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const indexName = process.env.INDEX_NAME || "resumes";
    const index = pc.index(indexName);
    console.log("📦 Pinecone index ready:", indexName);

    // ✅ Process each chunk
    let chunkCount = 0;
    // 👇 Use namespace for upsert
    const namespace = index.namespace(resumeId); // Add this to specify the namespace
    for (const chunk of chunks) {
      chunkCount++;
      console.log(`🚀 Processing chunk ${chunkCount}/${chunks.length}...`);

      const embedding = await embedTextWithGemini(chunk);
      console.log(`🧠 Embedding generated for chunk ${chunkCount} (length: ${embedding.length})`);
      console.log(embedding, "embedding");

      await prisma.chunk.create({
        data: {
          documentId: document.id,
          content: chunk,
          embedding,
        },
      });

      // 👇 Upsert into the resumeId namespace
      await namespace.upsert([
        {
          id: `${resumeId}-${chunkCount}`,
          values: embedding,
          metadata: { documentId: document.id, content: chunk },
        },
      ]);
      console.log(`📤 Chunk ${chunkCount} uploaded to Pinecone namespace ${resumeId}.`);
    }
    console.log("✅ All chunks processed successfully!");

    const interviewSessionId = await createInterviewSession({
      userId: user.id,
      resumeId: resume.id,
      jobRole: "software engineer",
      aiInterviewerId: "default-ai",
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      resumeId,
      interviewSessionId,
    });
  } catch (error: any) {
    console.error("❌ [UPLOAD ERROR]:", error);
    console.error("📛 Stack trace:", error?.stack || "No stack available");

    // Extra Prisma-specific handling
    if (error.code) {
      console.error("🧩 Prisma Error Code:", error.code);
      console.error("🧾 Prisma Meta:", error.meta);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Unexpected server error" },
      { status: 500 }
    );
  } finally {
    console.log("🔚 [END] Upload route finished at:", new Date().toISOString());
  }
}