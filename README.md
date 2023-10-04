# Opting into the Vercel Data Cache in Vercel's build pipeline

For context, see this issue: https://github.com/vercel/next.js/issues/56370.

Essentially, the Vercel build pipeline needs three environment variables to be set to enable using the `FetchCache` instead of the `FileSystemCache`. This repo shows what's necessary to get those environment variables dynamically. The environment variables are:
- `SUSPENSE_CACHE_URL`
- `SUSPENSE_CACHE_ENDPOINT`
- `SUSPENSE_CACHE_AUTH_TOKEN`

We need to do this dynamically because the auth token Vercel uses, `SUSPENSE_CACHE_AUTH_TOKEN`, is short-lived and created per-route handler. So we can hijack an auth token created for a route handler to authorize the build pipeline to connect to Vercel's Data Cache.


## 1. Route Handler

We can read the environment variable values from the global `globalThis.__incrementalCache` object that Next.js fortunately populates and exposes. If this wasn't globally-accessible, then it'd be much harder to find the cache endpoint and credentials. The entire route handler (with a secret for protection) looks like:

```typescript
// src/app/api/get-sc-creds/route.ts
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
```

This returns the environment variables we need, or an empty string on failure. This is important for the next step.

## 2. Bash Script

Because the environment variables—particularly the auth token—are quite short-lived and dynamic, we read them at build time in the route handler using a simple bash script:

```bash
get_path="http://$VERCEL_BRANCH_URL/api/get-sc-creds?BUILD_SECRET=$BUILD_SECRET"
response=$(curl -s $get_path)
# If we got a valid response, then export to process
if [[ "$response" == *"SUSPENSE_CACHE_"* ]]; then
  export $(echo $response | xargs) >/dev/null 2>&1
fi
```

Notice that this uses the `VERCEL_BRANCH_URL` system environment variable to source which route handler's endpoint the Data Cache credentials are coming from. You can't use `VERCEL_URL`, as this will point to the latest deployment, which is the one being created in the build script. Note also that if this is the first commit on the branch or in the repo, the cURL will return a not found page and no environment variables will be set. This is actually probably fine—in the case of the first deployment on the branch or repo, there won't be a Build Cache to take stale data from, so this will use an empty filesystem cache and perform all the requests anyways.

## 3. package.json

Now, all that's needed is to source from our bash script before we build. Simply prepend the bash command to your `build` script:

```javascript
{
  ...,
  "scripts": {
    ...,
    "build": "source ./get-sc-creds.sh; next build"
  }
}
```

Now, your build pipeline should be hooked into the Vercel Data Cache.

# Conclusion

Please implement something like this behavior by default in the build pipeline Vercel 😭😭😭😭
