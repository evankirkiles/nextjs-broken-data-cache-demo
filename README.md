# Opting into the Vercel Data Cache in Vercel's build pipeline

For context, see this issue: https://github.com/vercel/next.js/issues/56370.

Essentially, the Vercel build pipeline needs three environment variables to be set to enable using the `FetchCache` instead of the `FileSystemCache`. This repo shows what's necessary to get those environment variables dynamically. The environment variables are:
- `SUSPENSE_CACHE_URL`
- `SUSPENSE_CACHE_ENDPOINT`
- `SUSPENSE_CACHE_AUTH_TOKEN`

We need to do this dynamically because the auth token Vercel uses, `SUSPENSE_CACHE_AUTH_TOKEN`, is short-lived and created per-route handler. So we can hijack an auth token created for a route handler to authorize the build pipeline to connect to Vercel's Data Cache.

## 0. Configuration

You'll need to set two environment variables on your project, and an optional third:

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The protocol and domain (without the endpoint) under which your revalidation route handler calls are performed. If you use a custom domain for your project, _it will be that_. You can't use `VERCEL_URL` because it points to the latest deployment and, as such, won't have a route handler at the time of build. You can't use `VERCEL_BRANCH_URL` because the auth token JWT needs to contain inside the same domain as your ISR route handler that performs `revalidateTag`, even if they point to the same deployment—I don't know why, and this seems like it might be something that should be looked at by Vercel.  | https://my-project-name.vercel.app |
| `BUILD_SECRET` | A secret used to protect the route handler which dynamically retrieves `SUSPENSE_CACHE_` values. | Use bash's `uuidgen` for a simple UUID. |
| `NEXT_PRIVATE_DEBUG_CACHE` | An optional environment variable to turn on Next.js incremental cache debug logs. This allows you to see if your FetchCache is correctly being used in the build pipeline. | `1` |

## 1. Route Handler

We can read the environment variable values from the global `globalThis.__incrementalCache` object that Next.js fortunately populates and exposes within route handlers. If this wasn't globally-accessible, then it'd be much harder to find the cache endpoint and credentials. The entire route handler (with a secret for protection) looks like:

```typescript
// src/app/api/get-sc-creds/route.ts
import { NextRequest, NextResponse } from "next/server";
// cache types for intellisense
import FetchCache from "next/dist/server/lib/incremental-cache/fetch-cache";
import type { IncrementalCache } from "next/dist/server/lib/incremental-cache";

declare global {
  var __incrementalCache: IncrementalCache;
}

// Not necessarily, but to be safe and not cache secrets
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {

  // validate the build secret for route protection
  const { searchParams } = req.nextUrl;
  const BUILD_SECRET = searchParams.get("BUILD_SECRET");
  if (!BUILD_SECRET || BUILD_SECRET !== process.env.BUILD_SECRET) {
    return NextResponse.json("", { status: 401 });
  }

  try {
    // access the global incremental cache object, making sure its a FetchCache
    const { cacheHandler } = globalThis.__incrementalCache;
    if (!(cacheHandler instanceof FetchCache)) return NextResponse.json("");
    // parse our environment variables
    const endpoint = new URL(cacheHandler["cacheEndpoint"]);
    const SUSPENSE_CACHE_URL = endpoint.hostname;
    const SUSPENSE_CACHE_ENDPOINT = endpoint.pathname.replace("/", "");
    const SUSPENSE_CACHE_AUTH_TOKEN = cacheHandler["headers"][
      "Authorization"
    ].replace("Bearer ", "");
    // return them in a way we can pipe directly into `$ export`
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
get_path="$NEXT_PUBLIC_SITE_URL/api/get-sc-creds?BUILD_SECRET=$BUILD_SECRET"
response=$(curl -s $get_path)
# If we got a valid response, then export to process
if [[ "$response" == *"SUSPENSE_CACHE_"* ]]; then
  echo "Got valid suspense cache credentials."
  export $(echo $response | xargs) >/dev/null 2>&1
fi
```

Note that if this is the first commit on the branch or in the repo, the cURL will return a not found page and no environment variables will be set. This is actually probably fine—in the case of the first deployment on the branch or repo, there won't be a Build Cache to take stale data from, so this will use an empty filesystem cache and perform all the requests anyways.

## 3. package.json

Now, all that's needed is to source the environment variables from our bash script before we build. Simply prepend the bash command to your `build` script:

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


### Did it work?

If you set `NEXT_PRIVATE_DEBUG_CACHE=1` on your project, you can see if your build process is reading from the fetch cache if it says `"using fetch cache handler"`:

```
$ source ./get-sc-creds.sh; next build
Got valid suspense cache credentials.
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
using filesystem cache handler
using fetch cache handler
using cache endpoint https://iad1.suspense-cache.vercel-infra.com
using memory store for fetch cache
   Generating static pages (0/6) ...
using filesystem cache handler
using fetch cache handler
using cache endpoint https://iad1.suspense-cache.vercel-infra.com
using memory store for fetch cache
using filesystem cache handler
using fetch cache handler
using cache endpoint https://iad1.suspense-cache.vercel-infra.com
using memory store for fetch cache
using filesystem cache handler
using fetch cache handler
using cache endpoint https://iad1.suspense-cache.vercel-infra.com
using memory store for fetch cache

   Generating static pages (1/6) 

   Generating static pages (2/6) 
using filesystem cache handler
using fetch cache handler
using cache endpoint https://iad1.suspense-cache.vercel-infra.com

   Generating static pages (4/6) 
got fetch cache entry for c4852ff8dabbfcfd6cbcd107a08ebc216c384401e06c6180112b86088498b5ce, duration: 2481ms, size: 3, cache-state: fresh tags: time softTags: _N_T_/layout,_N_T_/page,_N_T_/
got fetch cache entry for c4852ff8dabbfcfd6cbcd107a08ebc216c384401e06c6180112b86088498b5ce, duration: 58ms, size: 3, cache-state: fresh tags: time softTags: _N_T_/layout,_N_T_/page,_N_T_/

 ✓ Generating static pages (6/6) 
   Finalizing page optimization ...
   Collecting build traces ...
Route (app)                              Size     First Load JS
┌ ○ /                                    1.29 kB        81.7 kB
├ ○ /_not-found                          883 B          81.3 kB
├ λ /api/get-sc-creds                    0 B                0 B
└ λ /api/revalidate                      0 B                0 B
+ First Load JS shared by all            80.5 kB
  ├ chunks/864-e2ce932f5f5f70ad.js       27.5 kB
  ├ chunks/fd9d1056-34f0535b06a5adb7.js  51 kB
  ├ chunks/main-app-8f13c08947745519.js  234 B
  └ chunks/webpack-0b57cc7580715949.js   1.76 kB
λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
○  (Static)  automatically rendered as static HTML (uses no initial props)
Done in 14.96s.
```



