import { passwordMatches, sessionCookie, json } from "../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD is not set on the server" }, 500);
  let body = {};
  try { body = await request.json(); } catch {}
  if (!(await passwordMatches(env, body.password))) {
    await new Promise((r) => setTimeout(r, 900)); // slow down guessing
    return json({ error: "Wrong password" }, 401);
  }
  return json({ ok: true }, 200, { "set-cookie": await sessionCookie(env) });
}
