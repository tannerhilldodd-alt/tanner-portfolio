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
    if (mod) {
      const method = request.method === "HEAD" ? "GET" : request.method;
      const fn = mod[handlerName(method)];
      if (!fn) return new Response("Method not allowed", { status: 405 });
      return fn({ request, env, params, ctx });
    }
    return env.ASSETS.fetch(request);
  },
};
