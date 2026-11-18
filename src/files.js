// Serves uploaded clips from R2, with byte ranges so videos can stream and seek.
export async function onRequestGet({ request, env, params }) {
  const key = (params.path || []).join("/");
  if (!key.startsWith("uploads/")) return new Response("Not found", { status: 404 });
  const hasRange = request.headers.has("range");
  const obj = await env.BUCKET.get(key, hasRange ? { range: request.headers } : {});
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("accept-ranges", "bytes");
  if (!headers.has("cache-control")) headers.set("cache-control", "public, max-age=31536000, immutable");
  if (hasRange && obj.range) {
    let start, length;
    if ("suffix" in obj.range) { length = Math.min(obj.range.suffix, obj.size); start = obj.size - length; }
    else { start = obj.range.offset ?? 0; length = obj.range.length ?? obj.size - start; }
    headers.set("content-range", `bytes ${start}-${start + length - 1}/${obj.size}`);
    headers.set("content-length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set("content-length", String(obj.size));
  return new Response(obj.body, { headers });
}
