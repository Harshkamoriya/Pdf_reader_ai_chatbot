import prisma from "@/app/lib/db";


const SEVERITY_MAP :Record<string,number>  = {
    TAB_SWITCH :1,
    FULLSCREEN_EXIT:2,
    COPY_PASTE:1,
    RIGHT_CLICK:1,
    CAMERA_MISSING:3,
    AUDIO_ANOMALY:2,
}

export async function POST(req:Request){
    const body = await req.json();
    const severity = SEVERITY_MAP[body.eventType]??1;
    await prisma.proctoringEvent.create({
        data:{
            roundSessionId: body.roundSessionId,
            eventType:body.eventType,
            severity,
            metadata:body.metadata,

        }
    })

    await prisma.roundSession.update({
        where:{
            id:body.roundsessionId},
            data:{
                cheatingScore:{
                    increment:severity,
                }
            }
        }
    )
    return Response.json({success: true});
}

