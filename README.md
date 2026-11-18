# Tanner Hill Dodd portfolio

A static page on Cloudflare Pages, plus a few small server functions for the password-locked editor.

## How it fits together
- `public/index.html` is the site. It loads its content from `/api/content`.
- `public/content.json` is the starting content, used until the first save.
- `public/media/` holds the first clips. Clips added through the editor go to Cloudflare R2.
- `functions/api/*` handles login, saving content and uploads. `functions/files/*` streams uploaded clips.
- `lib/auth.js` checks the password and signs the login cookie, which lasts 30 days.
- `index.html` at the top level is only the Claude preview copy. Visitors never see it.

## One-time setup on Cloudflare
1. Create a free Cloudflare account.
2. Go to R2 and create a bucket named `tanner-hill-dodd-media`. The free tier covers 10 GB.
3. Go to Workers & Pages, then Create, then Pages, then Connect to Git, and pick this repository.
   - Build command: leave it empty.
   - Build output directory: `public`.
4. In the Pages project, open Settings, then Bindings, and add an R2 bucket:
   - Variable name: `BUCKET`
   - Bucket: `tanner-hill-dodd-media`
5. In Settings, open Variables and secrets and add a **Secret**:
   - Name: `ADMIN_PASSWORD`
   - Value: your password
   Only you know it, and it never appears in the code.
6. Redeploy once, from Deployments, using Retry deployment.

## Using the editor
Click the lock in the bottom-right corner of the footer and enter your password. From there you can:
- add a clip
- replace a clip (the old one moves to Archive)
- archive or delete a clip
- reorder clips
- edit the name, bio, email, social links and "Last updated" date

Then press **Save changes**. Every save is also kept as a backup in R2 under `backups/`.

Keep uploads under 95 MB. An H.264 MP4 at 1920 × 804, 20 Mbps and a few seconds long is about 15 MB.

To change the password, change the `ADMIN_PASSWORD` secret and redeploy. That signs out every device.
