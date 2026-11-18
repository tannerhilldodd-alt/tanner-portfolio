// Password check and signed session cookie. The password lives only in the
// ADMIN_PASSWORD secret on Cloudflare, never in the page.
const enc = new TextEncoder();
const COOKIE = "thd_s";
const DAYS = 30;

function b64url(buf) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}
function sameString(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
// Changing ADMIN_PASSWORD signs everyone out, because it is part of the key.
const signingKey = (env) => `v1|${env.ADMIN_PASSWORD}|${env.SESSION_SECRET || ""}`;

export async function passwordMatches(env, given) {
  if (!env.ADMIN_PASSWORD || typeof given !== "string") return false;
  const k = signingKey(env);
  return sameString(await hmac(k, "pw:" + given), await hmac(k, "pw:" + env.ADMIN_PASSWORD));
}
export async function sessionCookie(env) {
  const exp = Date.now() + DAYS * 864e5;
  const token = `${exp}.${await hmac(signingKey(env), "s:" + exp)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DAYS * 86400}`;
}
export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const m = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return sameString(sig, await hmac(signingKey(env), "s:" + exp));
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
export const unauthorized = () => json({ error: "Not signed in" }, 401);
