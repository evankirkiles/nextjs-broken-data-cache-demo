/*
 * route.ts
 * author: evan kirkiles
 * created on Tue Oct 03 2023
 * 2023 the nobot space
 */

import { NextRequest, NextResponse } from "next/server";

declare global {
  var evan_SUSPENSE_CACHE_URL: string;
  var evan_SUSPENSE_CACHE_ENDPOINT: string;
  var evan_SUSPENSE_CACHE_AUTH_TOKEN: string;
}

export function GET(req: NextRequest) {
  const {
    evan_SUSPENSE_CACHE_URL,
    evan_SUSPENSE_CACHE_ENDPOINT,
    evan_SUSPENSE_CACHE_AUTH_TOKEN,
  } = globalThis;
  return NextResponse.json({
    evan_SUSPENSE_CACHE_URL,
    evan_SUSPENSE_CACHE_ENDPOINT,
    evan_SUSPENSE_CACHE_AUTH_TOKEN,
  });
}
