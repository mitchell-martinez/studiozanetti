# Domain Cutover SEO Checklist

This runbook is for launching the rebuilt front-end at the production domain when a temporary staging host is being used as a staging environment.

## Recommended Strategy

Because the final domain already exists and staging is temporary, this is primarily a **launch/cutover** rather than a long domain migration.

- Point the production domain to the new stack.
- Set `SITE_URL=https://studiozanetti.com.au` in the frontend container.
- Keep the staging host non-indexed after launch.
- Long-lived redirects from staging are optional. A short transition period is enough if the staging host was not heavily indexed.

## 1. Pre-Cutover (24-48h before)

1. Deploy latest app code to staging so SEO endpoints exist.
2. Verify these staging URLs return `200`:
   - `https://<staging-host>/robots.txt`
   - `https://<staging-host>/sitemap.xml`
3. Ensure container env has:
   - `WORDPRESS_URL=https://<your-cms-domain>`
   - `SITE_URL=https://studiozanetti.com.au` only when you are ready to launch.
4. In WordPress `wp-config.php`, verify:
   - `define( 'SZ_FRONTEND_URL', 'https://studiozanetti.com.au' );`
   - preview URLs still work.

## 2. Cutover Window

1. Update DNS for the production domain to the new frontend endpoint.
2. Restart the frontend container with:
   - `SITE_URL=https://studiozanetti.com.au`
3. Update GitHub Actions variables (Settings → Secrets and variables → Actions → Variables):
   - `STAGING_URL` → new staging URL (or remove if no longer needed)
   - `PRODUCTION_URL` → `https://studiozanetti.com.au`
4. Purge CDN/cache if used.
5. Smoke test key URLs on the production domain.

## 3. Post-Cutover Validation (immediately)

Run from your machine:

```bash
curl -sSI https://studiozanetti.com.au/ | head -n 10
curl -sSI https://studiozanetti.com.au/robots.txt | head -n 10
curl -sSI https://studiozanetti.com.au/sitemap.xml | head -n 10
```

Expected:

- Home: `200`
- `robots.txt`: `200 text/plain`
- `sitemap.xml`: `200 application/xml`

Check a few page sources for canonical + JSON-LD:

- canonical should point to `https://studiozanetti.com.au/...`
- JSON-LD should include `WebPage` and `BreadcrumbList`

## 4. Staging Host After Launch

Set staging host to discourage indexing:

- return `X-Robots-Tag: noindex, nofollow` at edge/reverse proxy, or
- serve an app-level `noindex` meta on staging builds.

If you want a brief safety net, keep staging accessible for a short period with selective redirects, then disable.

## 5. Replace Any Old Absolute URLs in WordPress

### Quick answer to: "How do I easily change all staging links in WordPress to the production domain?"

Use one WP-CLI command from inside the WordPress container. It updates classic content, ACF/meta values, and serialized data safely.

Menu links are already normalized by `sz-headless.php`, but WYSIWYG/ACF content can still contain absolute URLs.

Use WP-CLI search-replace inside the WordPress container.

### Dry run first

```bash
docker exec wordpress wp search-replace \
  'https://staging.example.com' \
  'https://studiozanetti.com.au' \
  --all-tables-with-prefix \
  --precise \
  --dry-run \
  --report-changed-only \
  --allow-root
```

### Execute

```bash
docker exec wordpress wp search-replace \
  'https://staging.example.com' \
  'https://studiozanetti.com.au' \
  --all-tables-with-prefix \
  --precise \
  --report-changed-only \
  --allow-root
```

Notes:

- `wp search-replace` safely handles serialized data used by ACF/meta fields.
- Keep a DB backup before running live replacement.
- Repeat for non-https variants if they exist.

Optional follow-up checks:

```bash
docker exec wordpress wp db query "SELECT COUNT(*) AS cnt FROM wp_posts WHERE post_content LIKE '%staging.example.com%';" --allow-root
```

If your table prefix is not `wp_`, use your real prefix in the query.

## 6. Search Console/Bing

After cutover:

1. Add/verify `https://studiozanetti.com.au` property.
2. Submit `https://studiozanetti.com.au/sitemap.xml`.
3. Request indexing for home + top service pages.

## 7. Optional Automated Smoke Check

Run the built-in SEO smoke script before and after cutover.

```bash
# defaults to SITE_URL env var
npm run seo:smoke

# or target staging explicitly
npm run seo:smoke -- https://staging.example.com
```

It checks:

- home, robots, and sitemap status codes
- robots and sitemap content markers
- canonical and JSON-LD presence on the homepage

## 8. Rollback Plan

If something fails:

1. Point DNS back to previous target.
2. Restore previous container env.
3. Re-run smoke checks.
