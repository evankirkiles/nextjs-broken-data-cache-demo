import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export function POST(req: NextRequest) {
  console.log(JSON.stringify(req.headers));
  // console.log(`SUSPENSE_CACHE_URL: ${process.env.SUSPENSE_CACHE_URL}`);
  revalidateTag("time");
  return NextResponse.json({
    success: true,
    time: new Date().toLocaleString(),
  });
}
