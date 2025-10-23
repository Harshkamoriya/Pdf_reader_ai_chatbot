import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedTextWithGemini } from "@/app/lib/gemini";
import prisma from "@/app/lib/db";
import { pdf } from "pdf-parse";

export async function POST(req: Request) {
  try {
    console.log("🟢 [START] Upload route called");

    const formData = await req.formData();
    console.log("📦 formData received");

    const file = formData.get("file") as File;
    if (!file) {
      console.error("❌ No file uploaded");
      throw new Error("No file uploaded");
    }

    console.log(
      "📄 File received:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("💾 File converted to buffer. Buffer length:", buffer.length);

    // Parse PDF
    const pdfData = await pdf(buffer);
    const fullText = pdfData.text;
    console.log("📚 PDF parsed. Extracted text length:", fullText.length);

    // Chunk text
    const CHUNK_SIZE = 500;
    const chunks: string[] = [];
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
      chunks.push(fullText.slice(i, i + CHUNK_SIZE));
    }
    console.log("🧩 Total chunks created:", chunks.length);

    // Create document in Prisma
    const document = await prisma.document.create({
      data: {
        title: file.name || "Untitled Document",
        fileUrl: "",
      },
    });
    console.log("🗃️ Document created in DB with ID:", document.id);

    // Initialize Pinecone
    console.log(
      "🔑 PINECONE_API_KEY:",
      process.env.PINECONE_API_KEY ? "Loaded ✅" : "Missing ❌"
    );
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    console.log("📂 Connecting to Pinecone index: rag-demo-index");
    const index = pc.index("rag-demo-index");

    // Embed and upsert each chunk
    let chunkCount = 0;
    for (const chunk of chunks) {
      chunkCount++;
      console.log(`🧠 [${chunkCount}/${chunks.length}] Embedding chunk...`);

      const embedding = await embedTextWithGemini(chunk);
      console.log(`✅ Embedding generated for chunk ${chunkCount}` , embedding);

      await prisma.chunk.create({
        data: { documentId: document.id, content: chunk, embedding },
      });
      console.log(`💾 Chunk ${chunkCount} stored in database`);

      await index.upsert([
        {
          id: `${document.id}-${Math.random()}`,
          values: embedding,
          metadata: { documentId: document.id, text: chunk },
        },
      ]);
      console.log(`📤 Chunk ${chunkCount} uploaded to Pinecone`);
    }

    console.log("🎉 [SUCCESS] All chunks processed successfully!");
    return NextResponse.json({ success: true, documentId: document.id });
  } catch (error) {
    console.error("❌ upload error:", error);
    return NextResponse.json({ success: false, error: (error as any).message });
  }
}
