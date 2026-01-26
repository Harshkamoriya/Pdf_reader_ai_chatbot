import { GoogleGenerativeAI } from "@google/generative-ai";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateWithGemini(prompt: string) {
    console.log("inside the generate with gemini function");
    const generativeModel = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await generativeModel.generateContent(prompt);
console.log("result inside the generateWithGemini",result)
    // raw text from Gemini
    let text = result.response.text();
    console.log("text in the generative ai " , text)

    // Remove ```json or ``` code fences
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return text;
}


