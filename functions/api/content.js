import { isAuthed, json, unauthorized } from "../../lib/auth.js";

const KEY = "content.json";

export async function onRequestGet({ request, env }) {
  const obj = await env.BUCKET.get(KEY);
  if (obj) {
    return new Response(obj.body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }
  // First run: fall back to the starting content shipped with the site.
  const r = await env.ASSETS.fetch(new URL("/content.json", request.url));
  return new Response(r.body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

const isStr = (v) => typeof v === "string";
const okClip = (c) => c && isStr(c.src) && c.src.length < 500 && (c.poster === undefined || isStr(c.poster));

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return unauthorized();
  const text = await request.text();
  if (text.length > 200_000) return json({ error: "Too large" }, 413);
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: "Not valid JSON" }, 400); }
  if (!data || !Array.isArray(data.clips) || !Array.isArray(data.archive) || !data.clips.every(okClip) || !data.archive.every(okClip)) {
    return json({ error: "Content is missing clips or archive" }, 400);
  }
  const body = JSON.stringify(data, null, 2);
  // Keep every saved version so a mistake can be rolled back.
  await env.BUCKET.put(`backups/content-${new Date().toISOString()}.json`, body, { httpMetadata: { contentType: "application/json" } });
  await env.BUCKET.put(KEY, body, { httpMetadata: { contentType: "application/json" } });
  return json({ ok: true });
}
