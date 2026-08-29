/**
 * Cloudflare CDN URL helper.
 *
 * Uploads (see lib/api/upload.ts) hand back a bare `r2Key` like
 * `kyc/<partnerId>/images/profile-photo_v1.jpg` — a storage path, not a
 * fetchable URL. The bucket is served publicly from a Cloudflare custom
 * subdomain (the backend's CLOUDFLARE_CDN_DOMAIN), so a browsable URL is
 * just `${CDN_BASE_URL}/${r2Key}`. This is the one place that join happens.
 */
const CDN_BASE_URL = (process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_DOMAIN ?? "").replace(/\/$/, "");

if (!CDN_BASE_URL && typeof window !== "undefined") {
  console.error(
    "NEXT_PUBLIC_CLOUDFLARE_CDN_DOMAIN is not set — uploaded images (profile photo, …) will not resolve. Add it to .env.local."
  );
}

/**
 * Turns an `r2Key` into a public CDN URL, or returns `null` when it can't
 * (no domain configured, or an empty key) — callers should treat `null` as
 * "no usable image" rather than rendering a broken `<img>`.
 *
 * Pass `bust` to append a cache-busting query param: R2 objects are stored
 * `immutable, max-age=31536000` and profile photos reuse a fixed key per
 * partner, so without this a re-upload keeps serving the year-cached old
 * image from the edge/browser.
 */
export function cdnUrl(r2Key: string | null | undefined, opts?: { bust?: boolean }): string | null {
  if (!CDN_BASE_URL || !r2Key) return null;
  const url = `${CDN_BASE_URL}/${r2Key.replace(/^\//, "")}`;
  return opts?.bust ? `${url}?v=${Date.now()}` : url;
}
