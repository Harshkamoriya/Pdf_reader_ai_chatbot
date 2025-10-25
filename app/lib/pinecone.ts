import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export async function queryResumeChunks(resumeId: string, query: string, topK: number = 10) {
  console.log("📌 queryResumeChunks called with:", { resumeId, query, topK });

  // --- Generate embedding ---
  console.log("🧠 Generating embedding for query...");
  const model = genAi.getGenerativeModel({ model: "text-embedding-004" });
  const embedResult = await model.embedContent(query);
  const embedding = embedResult.embedding.values;
  console.log("✅ Embedding generated, length:", embedding.length);

  // --- Query Pinecone ---
  console.log(`📦 Querying Pinecone index "${process.env.PINECONE_INDEX_NAME}" in namespace "${resumeId}" with topK=${topK}...`);
  const queryResponse = await index.namespace(resumeId).query({
    vector: embedding,
    topK, // correct key
    includeMetadata: true,
  });
  console.log(`✅ Pinecone query returned ${queryResponse.matches.length} matches`);

  // --- Process results ---
  const chunks = queryResponse.matches.map((match) => {
console.log("🔹 Match:", { 
  score: match.score, 
  contentSnippet: String(match.metadata?.content).slice(0, 50) + "..." 
});
    return {
      content: match.metadata?.content as string,
      score: match.score,
    };
  });

  console.log("📄 Returning processed resume chunks" , chunks);
  return chunks;
}
