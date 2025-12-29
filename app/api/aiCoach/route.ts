import { NextRequest, NextResponse } from "next/server";

import prisma from "@/app/lib/db";


export async function POST(req : NextRequest){
    try {
        console.log("inside the post function")
       await prisma.aIInterviewer.create({
  data: {
    id: "default-ai",
    name: "VirtuInterview AI",
    description: "Default virtual interviewer",
    modelVersion: "gemini-1.5-pro",
    specialization: "General",
  },
});
return NextResponse.json({message : "ai coach generated successfully" , })
        
    } catch (error) {
        return NextResponse.json({message : "error creating the agent  ",  error})
    }
}