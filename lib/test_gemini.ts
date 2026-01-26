import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function run() {
  const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.5-flash-latest"
  ];
  for (const name of candidates) {
    try {
      process.stdout.write(`Testing model: ${name}... `);
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent("Say 'OK'");
      console.log(`✅ SUCCESS: ${result.response.text().trim()}`);
    } catch (e: any) {
      console.log(`❌ FAILED: ${e.message}`);
    }
  }
}

run();
