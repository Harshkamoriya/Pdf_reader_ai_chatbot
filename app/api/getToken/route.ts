// import { AssemblyAI } from "assemblyai";
// import { NextRequest, NextResponse } from "next/server";



// console.log(process.env.ASSEMBLY_API_KEY! , "apikey")
// const client = new AssemblyAI({
//   apiKey: process.env.ASSEMBLY_API_KEY!, // match your .env.local name
// });

// export async function GET(req: NextRequest) {
//   try {
// const token = await client.realtime.createTemporaryToken({
//   // @ts-expect-error: SDK typing doesn’t yet include this param
//   expires_in_seconds: 120,
// });

//     return NextResponse.json(token);
//   } catch (error) {
//     console.error("Error generating token:", error);
//     return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!process.env.ASSEMBLY_API_KEY) {
      console.error("ASSEMBLYAI_API_KEY is not set in environment variables");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    console.log("Attempting to fetch token with API key:", process.env.ASSEMBLY_API_KEY.substring(0, 5) + "..."); // Log partial key for debugging

    const response = await fetch("https://streaming.assemblyai.com/v3/token?expires_in_seconds=60", {
      method: "GET",
      headers: {
        authorization: process.env.ASSEMBLY_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token fetch failed:", response.status, errorText);
      throw new Error(`Failed to fetch token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Token fetched successfully:", data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Token fetch error:", error.message || error);
    return NextResponse.json({ error: error.message || "Failed to get token" }, { status: 500 });
  }
}