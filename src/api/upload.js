import { isAuthed, json, unauthorized } from "../auth.js";

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return unauthorized();
  const type = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!/^(video|image)\//.test(type)) return json({ error: "Only video or image files" }, 415);
  const name = new URL(request.url).searchParams.get("name") || "clip";
  const safe = name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "clip";
  const key = `uploads/${Date.now()}-${safe}`;
  await env.BUCKET.put(key, request.body, { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" } });
  return json({ url: `/files/${key}` });
}
