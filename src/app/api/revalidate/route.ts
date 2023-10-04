import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export function POST(req: NextRequest) {
  console.log(process.env);
  console.log(process.env.SUSPENSE_CACHE_AUTH_TOKEN);
  // console.log(`SUSPENSE_CACHE_URL: ${process.env.SUSPENSE_CACHE_URL}`);
  revalidateTag("time");
  return NextResponse.json({
    success: true,
    time: new Date().toLocaleString(),
  });
}
