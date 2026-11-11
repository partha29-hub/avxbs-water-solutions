import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Admin registration is disabled.",
    },
    { status: 403 }
  );
}