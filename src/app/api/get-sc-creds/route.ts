/*
 * route.ts
 * author: evan kirkiles
 * created on Tue Oct 03 2023
 * 2023 the nobot space
 */

import { NextRequest, NextResponse } from "next/server";

declare global {
  var __incrementalCache: any;
}

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const BUILD_SECRET = searchParams.get("BUILD_SECRET");
  if (!BUILD_SECRET || BUILD_SECRET !== process.env.BUILD_SECRET) {
    return NextResponse.json("", { status: 401 });
  }

  let SUSPENSE_CACHE_URL: string | null = null;
  let SUSPENSE_CACHE_ENDPOINT: string | null = null;
  let SUSPENSE_CACHE_AUTH_TOKEN: string | null = null;
  try {
    const { cacheHandler } = globalThis.__incrementalCache;
    const endpoint = new URL(cacheHandler.cacheEndpoint);
    SUSPENSE_CACHE_URL = endpoint.hostname;
    SUSPENSE_CACHE_ENDPOINT = endpoint.pathname.replace("/", "");
    SUSPENSE_CACHE_AUTH_TOKEN = cacheHandler["headers"][
      "Authorization"
    ].replace("Bearer ", "");
    return NextResponse.json(
      `SUSPENSE_CACHE_URL=${SUSPENSE_CACHE_URL} SUSPENSE_CACHE_ENDPOINT=${SUSPENSE_CACHE_ENDPOINT} SUSPENSE_CACHE_AUTH_TOKEN=${SUSPENSE_CACHE_AUTH_TOKEN}`
    );
  } catch (e) {}
  return NextResponse.json("");
}
