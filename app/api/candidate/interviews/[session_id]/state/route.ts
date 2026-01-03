/// write logic to find the state of the interview session running now okay 

import prisma from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function fetchInterviewState( req:NextRequest){

    const sessionId = req.nextUrl.searchParams.get("session_id");

    if(!sessionId){
        return Response.json({success:false , message:"Session id is required"}, {status:400})
    }

    const session = await prisma.interviewSession.findUnique({
        where:{id:sessionId},
        include:{
            job:true,
            roundSessions:{
                include:{
                    round:true
                }
            }
        }
    
    })

    const status  = session?.status
    return NextResponse.json({success:true , status})
}