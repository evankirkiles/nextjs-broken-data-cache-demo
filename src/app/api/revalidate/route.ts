import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export function POST() {
  revalidateTag("time");
  return NextResponse.json({
    success: true,
    time: new Date().toLocaleString(),
  });
}
