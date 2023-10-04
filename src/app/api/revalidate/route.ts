import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

declare global {
  var __incrementalCache: any;
}

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const BUILD_SECRET = searchParams.get("BUILD_SECRET");
  if (!BUILD_SECRET || BUILD_SECRET !== process.env.BUILD_SECRET) {
    return NextResponse.json("", { status: 401 });
  }

  try {
    const { cacheHandler } = globalThis.__incrementalCache;
    const endpoint = new URL(cacheHandler.cacheEndpoint);
    const SUSPENSE_CACHE_URL = endpoint.hostname;
    const SUSPENSE_CACHE_ENDPOINT = endpoint.pathname.replace("/", "");
    const SUSPENSE_CACHE_AUTH_TOKEN = cacheHandler["headers"][
      "Authorization"
    ].replace("Bearer ", "");
    return NextResponse.json(
      `SUSPENSE_CACHE_URL=${SUSPENSE_CACHE_URL} SUSPENSE_CACHE_ENDPOINT=${SUSPENSE_CACHE_ENDPOINT} SUSPENSE_CACHE_AUTH_TOKEN=${SUSPENSE_CACHE_AUTH_TOKEN}`
    );
  } catch (e) {}
  return NextResponse.json("");
}

export function POST(req: NextRequest) {
  revalidateTag("time");
  return NextResponse.json({
    success: true,
    time: new Date().toLocaleString(),
  });
}
