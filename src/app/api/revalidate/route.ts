import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export function POST(req: NextRequest) {
  revalidateTag("time");
  return NextResponse.json({
    success: true,
    time: new Date().toLocaleString(),
  });
}
