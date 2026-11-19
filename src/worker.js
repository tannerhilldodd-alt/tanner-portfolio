// Cloudflare Worker: serves the site from ./public and handles the editor's API.
import * as login from "./api/login.js";
import * as logout from "./api/logout.js";
import * as me from "./api/me.js";
import * as content from "./api/content.js";
import * as upload from "./api/upload.js";
import * as files from "./files.js";

const routes = {
  "/api/login": login,
  "/api/logout": logout,
  "/api/me": me,
  "/api/content": content,
  "/api/upload": upload,
};
const handlerName = (method) => "onRequest" + method.charAt(0) + method.slice(1).toLowerCase();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let mod = routes[url.pathname];
    let params = {};
    if (!mod && url.pathname.startsWith("/files/")) {
      mod = files;
      params.path = url.pathname.slice("/files/".length).split("/").map(decodeURIComponent);
    }
    if (!mod && (url.pathname === "/" || url.pathname === "/index.html") && request.method === "GET") {
      return homePage(request, env, url);
    }
    if (mod) {
      const method = request.method === "HEAD" ? "GET" : request.method;
      const fn = mod[handlerName(method)];
      if (!fn) return new Response("Method not allowed", { status: 405 });
      return fn({ request, env, params, ctx });
    }
    return env.ASSETS.fetch(request);
  },
};

// The home page gets the current content baked in (no blank flash while it loads)
// and a full link-preview image for when the site is shared.
async function homePage(request, env, url) {
  const res = await env.ASSETS.fetch(request);
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;
  let data = null;
  try {
    const obj = await env.BUCKET.get("content.json");
    data = obj ? await obj.json() : await (await env.ASSETS.fetch(new URL("/content.json", url))).json();
  } catch {}
  const safeJson = JSON.stringify(data).replace(/</g, "\\u003c");
  const poster = data && data.clips && data.clips[0] && data.clips[0].poster;
  const image = poster ? new URL(poster, url.origin + "/").href : url.origin + "/media/clip-01.jpg";
  const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const desc = data ? [data.bio1, data.bio2].filter(Boolean).join(" ") : "";
  const out = new HTMLRewriter()
    .on('meta[property="og:image"]', { element(e) { e.setAttribute("content", image); } })
    .on('meta[property="og:description"]', { element(e) { if (desc) e.setAttribute("content", desc); } })
    .on('meta[name="description"]', { element(e) { if (data && data.name) e.setAttribute("content", attr([data.name, desc].filter(Boolean).join(". "))); } })
    .on("head", {
      element(e) {
        e.append(`<meta property="og:url" content="${attr(url.origin)}/">`, { html: true });
        e.append(`<script>window.__CONTENT=${safeJson};</script>`, { html: true });
      },
    })
    .transform(res);
  const headers = new Headers(out.headers);
  headers.set("cache-control", "no-cache");
  return new Response(out.body, { status: out.status, headers });
}
