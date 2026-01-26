import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function checkModels() {
  const modelToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "gemini-pro",
  ];

  console.log("--- START MODEL TEST ---");
  for (const m of modelToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("test");
      console.log(`✅ ${m}: SUCCESS`);
    } catch (err: any) {
      console.log(`❌ ${m}: ${err.message.split('\n')[0]}`);
      // Check if it's 404 or something else
    }
  }
  console.log("--- END MODEL TEST ---");
}

checkModels();
