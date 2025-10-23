import { NextRequest, NextResponse } from "next/server";

// Correct syntax for GET handler
export async function GET(req: NextRequest) {
  try {
    console.log("Inside the backend of demo testing route");

    return NextResponse.json({
      success: true,
      message: "Tested successfully",
      status: 200,
    });
  } catch (error) {
    console.log("Error in the testing route:", error);

    return NextResponse.json({
      success: false,
      message: "Testing is facing some error",
      error: (error as any).message || error,
    });
  }
}
