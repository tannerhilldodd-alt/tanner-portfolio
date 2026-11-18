# Tanner Hill Dodd portfolio

A Cloudflare Worker that serves the static site from `public/` and runs the password-locked editor's API.

## How it fits together
- `public/index.html` is the site. It loads its content from `/api/content`.
- `public/content.json` is the starting content, used until the first save.
- `public/media/` holds the first clips. Clips added through the editor go to Cloudflare R2.
- `src/worker.js` routes `/api/*` and `/files/*` and serves everything else from `public/`.
- `src/api/*` handles login, saving content and uploads. `src/files.js` streams uploaded clips from R2.
- `src/auth.js` checks the password and signs the login cookie, which lasts 30 days.

## One-time setup on Cloudflare
1. Create an R2 bucket named `tanner-hill-dodd-media`.
2. In Workers & Pages, create a Worker from this GitHub repository. The Worker is named `tanner-portfolio`, and its deploy command is the default `npx wrangler deploy`.
   `wrangler.toml` already binds the bucket as `BUCKET` and serves `public/`.
3. Under the Worker's Settings, then Variables and Secrets, add a **Secret** called `ADMIN_PASSWORD`. Only you know its value.
4. Every push to `main` deploys automatically.

## Using the editor
Click the lock in the bottom-right corner of the footer and enter your password. From there you can:
- add a clip
- replace a clip (the old one moves to Archive)
- archive or delete a clip
- reorder clips
- edit the name, bio, email, social links and "Last updated" date

Then press **Save changes**. Every save is also kept as a backup in R2 under `backups/`.

Keep uploads under 95 MB. An H.264 MP4 at 1920 × 804, 20 Mbps and a few seconds long is about 15 MB.

To change the password, change the `ADMIN_PASSWORD` secret. That signs out every device.
