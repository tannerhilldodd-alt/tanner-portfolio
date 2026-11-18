import { isAuthed, json } from "../../lib/auth.js";
export const onRequestGet = async ({ request, env }) => json({ authed: await isAuthed(request, env) });
