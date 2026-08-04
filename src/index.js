/**
 * Squeeze — Tinify proxy.
 *
 * Static files in /public are served automatically; this Worker only runs for
 * paths that don't match a file. The Tinify key is a secret (TINIFY_KEY) and
 * never reaches the browser.
 */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname !== "/api") {
      return new Response("Not found", { status: 404 });
    }
    if (req.method !== "POST") {
      return new Response("POST an image body to /api", { status: 405 });
    }
    if (!env.TINIFY_KEY) {
      return new Response("TINIFY_KEY secret is not set on this Worker.", { status: 500 });
    }

    const auth = "Basic " + btoa("api:" + env.TINIFY_KEY);
    const bg = url.searchParams.get("bg") || "#FFFFFF";

    // 1. compress — 1 credit
    const shrink = await fetch("https://api.tinify.com/shrink", {
      method: "POST",
      headers: { Authorization: auth },
      body: await req.arrayBuffer(),
    });
    if (!shrink.ok) {
      return new Response(await shrink.text(), { status: shrink.status });
    }

    const location = shrink.headers.get("Location");
    const info = await shrink.json().catch(() => ({}));

    // 2. already a JPEG? download as-is. Otherwise convert — 1 more credit.
    const isJpeg = info?.output?.type === "image/jpeg";
    const out = isJpeg
      ? await fetch(location, { headers: { Authorization: auth } })
      : await fetch(location, {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({
            convert: { type: "image/jpeg" },
            transform: { background: bg },
          }),
        });
    if (!out.ok) {
      return new Response(await out.text(), { status: out.status });
    }

    return new Response(out.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "Image-Width": out.headers.get("Image-Width") ?? "",
        "Image-Height": out.headers.get("Image-Height") ?? "",
        "Compression-Count": out.headers.get("Compression-Count") ?? "",
      },
    });
  },
};
