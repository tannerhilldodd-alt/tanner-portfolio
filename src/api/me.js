import { isAuthed, json } from "../auth.js";
export const onRequestGet = async ({ request, env }) => json({ authed: await isAuthed(request, env) });
