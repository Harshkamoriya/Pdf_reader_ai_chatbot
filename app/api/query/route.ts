import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest, NextResponse } from "next/server";

import { embedTextWithGemini, queryGemini } from "@/app/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    console.log("📨 Received POST request");

    const { question } = await req.json();
    console.log("📝 Question received:", question);

    if (!question) {
      console.warn("⚠️ No question provided in the request");
      return NextResponse.json({ success: false, error: "Question is required" });
    }

    console.log("🧠 Generating embedding for the question...");
    const queryEmbedding = await embedTextWithGemini(question);
    console.log("✅ Embedding generated. Length:", queryEmbedding.length);

    // Connect to Pinecone
    console.log("🔌 Connecting to Pinecone...");
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.index("rag-demo-index");
    console.log("✅ Connected to Pinecone index: rag-demo-index");

    // Retrieve top 3 relevant chunks
    console.log("🔍 Querying Pinecone for similar chunks...");
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });
    console.log("✅ Pinecone query complete. Matches:", queryResponse.matches?.length);

    const chunks = queryResponse.matches?.map((m: any) => m.metadata.text) || [];
    console.log("📄 Retrieved chunks:", chunks);

    // Build augmented prompt
  const augmentedPrompt = `
You are an intelligent AI assistant that answers questions based on the provided context. 
Use only the context below to answer the question. 
If the context does not contain enough information, politely say: "I don't have enough information to answer that."

Context:
${chunks.length ? chunks.join("\n\n") : "No relevant context found."}

Question:
${question}

Answer:`;

    console.log("📝 Augmented prompt built:\n", augmentedPrompt);

    const answer = await queryGemini(augmentedPrompt);
    console.log("💬 Answer generated:", answer);

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error("❌ Error in /api/query:", error);
    return NextResponse.json({ success: false, error: (error as any).message });
  }
}
