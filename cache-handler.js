const FetchCache =
  require("next/dist/server/lib/incremental-cache/fetch-cache").default;

module.exports = class CacheHandler extends FetchCache {
  constructor(...args) {
    super(...args);
    const { _requestHeaders } = args[0];
    try {
      globalThis.evan_SUSPENSE_CACHE_URL = _requestHeaders["x-vercel-sc-host"];
      globalThis.evan_SUSPENSE_CACHE_ENDPOINT =
        _requestHeaders["x-vercel-sc-endpoint"];
      console.log(globalThis.evan_SUSPENSE_CACHE_URL);
      console.log(globalThis.evan_SUSPENSE_CACHE_ENDPOINT);
      const headers = _requestHeaders["x-vercel-headers"];
      if (headers && typeof headers === "string") {
        const authHeader =
          JSON.parse(headers)["Authorization"].split("Bearer ")[1];
        globalThis.evan_SUSPENSE_CACHE_AUTH_TOKEN = authHeader;
      }
    } catch (e) {}
  }
};
