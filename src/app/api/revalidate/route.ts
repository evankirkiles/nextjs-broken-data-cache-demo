import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export function POST() {
  console.log(`SUSPENSE_CACHE_URL: ${process.env.SUSPENSE_CACHE_URL}`);
  revalidateTag("time");
  return NextResponse.json({
    success: true,
    time: new Date().toLocaleString(),
  });
}
