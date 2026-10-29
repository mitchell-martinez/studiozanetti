# WordPress Configuration — Studio Zanetti Headless CMS

This directory contains the WordPress must-use plugin (`mu-plugin`) that configures the WordPress backend for the headless React Router front-end.

---

## Quick Setup

### 1. Install the mu-plugins

Copy the required files into your WordPress installation:

```
wp-content/
  mu-plugins/
    sz-headless.php        ← headless config + APIs
    sz-acf-schema.php      ← code-registered ACF fields
    includes/gallery-library.php ← legacy gallery storage compatibility
    assets/gallery-library-admin.js
    assets/gallery-library-admin.css
    sz-media-folders.php   ← media folder organization
    sz-attachment-permalinks.php ← collision-proof media permalinks
    sz-website-help.php    ← private editor guidance (default off)
    includes/website-help.php
    website-help/          ← versioned manifest and handbook topics
    assets/website-help.js
    assets/website-help.css
```

> **mu-plugins** are "must-use" plugins that are always active and cannot be deactivated from the admin. This is ideal for headless infrastructure code.

### 1b. Media folders (new)

After `sz-media-folders.php` is installed, editors can organize assets under:

1. **Media -> Folders** to create folder structure (supports parent/child folders)
2. **Media -> Library** to filter by folder in list view
3. Attachment details panel to assign a file to a folder

This keeps a large media library manageable for non-technical admins.

### 1c. Media permalinks

`sz-attachment-permalinks.php` keeps attachment records from consuming useful page slugs. Attachment pages use ID-based URLs such as `/image/893/`, while internal attachment slugs use `sz-image-893`.

Existing media is migrated automatically in small batches whenever an administrator loads WordPress admin. This changes only WordPress attachment records. Uploaded files remain at their existing `/wp-content/uploads/...` URLs, so images already used by pages, ACF fields, galleries, and posts continue to work.

### 2. Add constants to `wp-config.php`

Open `wp-config.php` in your WordPress root and add these lines **above** the `/* That's all, stop editing! */` comment:

```php
// Studio Zanetti — Headless front-end URL
define( 'SZ_FRONTEND_URL', 'https://your-domain.example.com' );

// Shared secret for preview authentication (generate a long random string)
define( 'SZ_PREVIEW_SECRET', 'replace-with-a-random-secret-string' );
```

For local development:

```php
define( 'SZ_FRONTEND_URL', 'http://localhost:5173' );
define( 'SZ_PREVIEW_SECRET', 'dev-preview-secret' );
```

### 3. Required WordPress Plugins

| Plugin                              | Purpose                                  | Required?        |
| ----------------------------------- | ---------------------------------------- | ---------------- |
| **Advanced Custom Fields Pro**      | Page builder blocks via Flexible Content | Yes              |
| _or_ ACF free + **ACF to REST API** | Exposes ACF fields in REST API           | Yes (if not Pro) |
| **Yoast SEO**                       | Meta titles, descriptions, OG images     | Recommended      |

### 4. Set the frontend `.env`

In the React Router project, create a `.env` or `.env.local` file:

```env
WORDPRESS_URL=https://cms.example.com
PREVIEW_SECRET=replace-with-a-random-secret-string
```

---

## What the mu-plugin does

### Navigation Menus

**REST endpoint:** `GET /wp-json/sz/v1/nav-menu/primary`

The front-end Navbar and Footer are driven by WordPress native menus.

**Setup in WordPress admin:**

1. Go to **Appearance → Menus**
2. Create a new menu called "Primary Navigation"
3. Add pages, custom links, or categories as menu items
4. **To create dropdown sub-links:** drag a menu item slightly to the right under its parent
5. Under **Menu Settings** at the bottom, check the **"Primary Navigation"** location
6. Click **Save Menu**

**Example menu structure for a photography site:**

```
Home              → /
Gallery           → /gallery
  ├─ Weddings     → /gallery?category=Weddings
  ├─ Portraits    → /gallery?category=Portraits
  └─ Events       → /gallery?category=Events
About             → /about
Pricing           → /pricing
Contact           → /contact
```

The Navbar renders top-level items as links and child items as dropdown sub-menus. On mobile, dropdowns appear as expandable accordion sections.

> **Tip:** The Gallery sub-links use `?category=` query parameters. The Gallery page reads this from the URL and auto-filters to that category.

### Visual Site Menu Manager

The **Appearance → Menus → Site Menus** tab shows every page grouped by the menu that page uses as its site header. It reads and updates each page's **Menu Override** setting, which is the same setting the front-end uses to select a subsite. Pages with no override belong to the menu assigned to **Primary Navigation**.

To create and organize the weddings site:

1. Open **Appearance → Menus → Site Menus**.
2. Enter `Straight Weddings Site` for the site name and `weddings-site` for the menu slug, then select **Add site menu**.
3. Drag pages from **Primary Navigation** into **Straight Weddings Site**. Changes save their Menu Override automatically; this does not add the page as a visible navigation link.
4. Select a page name to preview it. The preview opens at full height on the right on desktop and in the bottom half of the screen on mobile. On desktop, drag its left edge or select the expand icon to change its width.
5. Select the **X**, press Escape, or select outside the preview to close it.

The menu dropdown and arrow buttons on each item provide alternatives to drag-and-drop. Use the standard **Edit Menus** tab to choose which pages and custom links are visibly shown in each navigation menu, create nested dropdown links, or edit a custom URL.

### Content Preview

**REST endpoint:** `GET /wp-json/sz/v1/preview/<content_id>?secret=<secret>`

When you click **Preview** on a page or blog post, WordPress opens the React front-end with the latest saved content or autosave. Pages use the ACF page renderer; posts use the same blog layout as published posts. Private and draft posts remain unavailable at their public URL and are only exposed through the secret preview link.

**How it works:**

1. WordPress "Preview" button URL is rewritten to point to `SZ_FRONTEND_URL/preview?id=<id>&secret=<secret>`
2. The React front-end calls back to WordPress to fetch the draft content
3. The endpoint identifies the content as a page or post
4. The front end renders it with the corresponding production renderer and a preview banner

### Blog Post Buttons

The Classic Editor for blog posts includes **Add Button** beside **Add Media**.

1. Place the cursor where the button should appear.
2. Select **Add Button**.
3. Enter the required button text and link.
4. Choose **Left** or **Centre** alignment. Centre is selected by default.
5. Select **Insert Button**.

Use a full web address or a site-relative link beginning with `/`. Page editors do not show this control: pages must use the **Button Group** layout in the ACF page builder.

### Admin Cleanup

The mu-plugin automatically:

- **Keeps Posts available** for blog articles and hides Comments
- **Redirects the admin landing page** to the Pages list instead of the Dashboard
- **Removes unnecessary dashboard widgets** (Quick Draft, At a Glance, etc.)
- **Adds CSS fixes** to prevent the pages list from appearing "squished"
- **Hides the Comments menu** (not needed)

### CORS

The mu-plugin configures CORS headers on the REST API to allow requests from `SZ_FRONTEND_URL`.

### ACF REST API

The mu-plugin ensures ACF fields are exposed in the REST API via the `acf/rest_api/field_settings/show_in_rest` filter.

### Site Settings and public entities

Open **Site Settings** in the WordPress sidebar to manage the public facts used across the header, footer, and structured data. The fields are registered by `sz-acf-schema.php`; no manual ACF field-group setup is required.

Only enter information that is already intended to be public and can be verified:

1. **Site Name, Tagline, Copyright and Social Links** control the existing site branding and footer.
2. **Business Entity** supplies the business description, public contact details, full postal address, coordinates, service areas, logo, representative image, price range, founding date, awards, authoritative profile URLs, and reusable image-rights defaults.
3. **Primary Photographer** optionally publishes a linked Person entity. Enable it only when the named person should be publicly identified. Set **Business Relationship** to **Founder / owner** when the person owns the business or operates it as a sole trader; otherwise use **Employee**. Complete the public name and job title before using that person as an image or article creator.
4. **Service Catalog** is the authoritative list of services. Give every service a short stable key made from lowercase letters, numbers, and hyphens. Do not change a key after publishing because it forms the service's permanent structured-data ID.

Keep the public business name, address, phone number, and profile URLs consistent with external business listings. Blank optional fields are omitted from structured data rather than guessed.

### Page entities and selected images

The **Page Settings** panel provides two optional entity controls:

- **Primary Service** links a page to one service from the global catalog. Select the real service; the frontend never guesses from the page title or URL.
- **Venue Experience Page** enables a Place entity for pages substantially about one venue. Enter the public venue name, official URL, description, address, coordinates, and representative image.

Services Grid cards and Pricing Packages blocks also have an optional **Global Service** selector. Use it when the visible card or prices describe an authoritative service from Site Settings. Leave it blank for genuinely page-specific content; the frontend will publish a stable page-specific Service instead. Existing blocks continue to work without being edited.

For featured images, Hero images, Image blocks, Image + Text images, service images, and venue images, open the image in the Media Library to manage **Image Search Metadata**:

- Use **SEO Caption Override** only for a concise factual caption. The standard Media caption is used when the override is blank.
- Blank **Image Creator** values use the published Primary Photographer. Choose **Business / non-photographic asset** only for a logo, graphic, or other asset created by the business rather than the photographer.
- Use the licence, licensing-page, credit, and copyright overrides only when this image differs from the defaults under **Site Settings → Business Entity**. Never claim rights the business does not hold.
- Add **Location Created** only when the place is known and suitable for publication.

Always complete the standard Media Library alternative text for meaningful images. Alternative text remains an accessibility field; the SEO caption does not replace it.

### Page headings

Every Flexible Content page must render exactly one H1. A Hero title is the usual H1. Text, Image + Text, Image and Form blocks can also be configured as H1 when they are the page lead, but using more than one H1 blocks the page save.

Write a truthful, descriptive H1 that identifies the page's main subject. For a location-specific service page, naturally include the real service and area when useful. Do not repeat keywords or add locations the page does not serve. Other page sections should normally start at H2; heading-level skips appear as advisory audit findings.

Pages that use the native WordPress content editor instead of Flexible Content automatically render the page title as their H1.

### SEO, AI & Social manager

Open **SEO, AI & Social** in the WordPress sidebar. The existing URL and bookmarks remain valid.

The screen has two tabs:

1. **Search & Social Previews** manages canonical page titles, descriptions, and featured images with Google, Facebook, and X previews. These are the same fields used by each Page editor and continue to autosave.
2. **AI Searchability Audit** automatically reviews saved, non-container Pages. It does not send content to an AI service. Filter by page, status, or category, expand a page for evidence, and use the edit links to open the relevant page, Site Settings, or image. **Refresh Audit** recalculates one page after changes.

The audit groups transparent checks into Content Structure, Search & Social, Entity Graph, and Schema Consistency. Only zero or multiple H1 headings are publishing errors. Missing or long metadata, thin copy, heading skips, missing service/locality language, incomplete entities, image metadata, unresolved references, and incomplete FAQ rows are advisory warnings.

A page passing the audit does not guarantee rankings, rich results, or inclusion in an AI answer. The audit verifies code and editor inputs it can observe. Search authority still depends on useful original content, reputable links, consistent public business profiles and citations, relationships with venues and suppliers, and ongoing Search Console review.

The frontend emits one server-rendered Schema.org graph linking the business, website, optional primary photographer, services, pages, breadcrumbs, explicit venues, and selected images through stable IDs. It intentionally excludes self-serving Review/AggregateRating data, the deprecated ProfessionalService type, and a standalone Award type. FAQ data remains machine-readable only when complete visible FAQ rows exist; it should not be treated as a guaranteed Google rich-result feature.

### Reusable gallery editor

**Gallery Library > Insert Images** uses ACF's native gallery field with larger previews and a grid that expands into the page instead of scrolling inside a fixed-height panel. **Add Image** sits above the grid and opens the media library for one or multiple selections. New selections append to the collection; drag thumbnails to reorder. Every image has visible **Edit** and **Remove** controls. **Edit** (or a thumbnail click) opens ACF's native WordPress image dialog and refreshes the preview when confirmed. Attachment edits affect every use of that image; **Remove** only changes this collection. The former per-image caption field is removed.

Deploy `sz-acf-schema.php`, `sz-headless.php`, `includes/gallery-library.php`, both `assets/gallery-library-admin.*` files, and the updated Website Help assets and handbook together. The compatibility helper reads existing repeater counts and `images_N_image` metadata in order without changing the database on read. Saving stores native ordered attachment IDs; old row metadata is left in place but no longer read once the gallery has been saved. The existing gallery import endpoint still accepts its row-based input, and public gallery payloads retain the frontend's `{ image, caption }` shape. Native gallery items have an empty per-gallery caption; attachment metadata remains separate.

Run the PHP suite, Website Help UI tests, and `npm run test:e2e -- e2e/gallery-library.spec.ts` after changes. The gallery browser regression checks both stylesheet orders because ACF's native `data-columns` widths must not shrink cards inside the CSS grid; the override assets also depend on `acf-pro-input` to load afterwards. On a WordPress instance, check an existing and a new gallery: cancel media selection, add several images, edit one image, reorder and remove thumbnails, update and reopen, and preview a page referencing it. Confirm the toolbar is above the grid, the grid expands with the page, and Edit/Remove remain visible on a narrow screen. Preserve ACF's attachment float style when changing the grid: jQuery UI uses it to detect movement between columns while sorting.

### Website Help assistant

`sz-website-help.php` adds a global admin help drawer and a full **Website Help** page for Editors and Administrators. It is guidance-only: it has no tools or endpoints that modify pages, posts, galleries, media, menus, settings, or plugins.

#### Using the help workspace

- Open **Website Help** from the floating button, or use its WordPress menu entry for the full-page workspace.
- The drawer starts with a conversation-first layout. Select **History** to find earlier chats, and **Back to chat** to return. On a wide full-page workspace, history sits beside the conversation and can be hidden.
- Select a suggested question to fill the message box, then select the up-arrow **Send message** button inside the input. Suggestions never send questions automatically. The input uses the general prompt **Type a message...**.
- The input starts at its single-line height and grows upward as text wraps or you add lines. The send arrow stays in the bottom-right corner. Long drafts scroll inside the input after it reaches its height limit.
- Replies display paragraphs, headings, bold, emphasis, lists, quotes, and code. User messages stay literal. Reply formatting is rendered as text and semantic elements, never executable HTML; source links remain separate.
- Use **New chat** for a fresh topic. Text you type while the new chat is starting is kept. Conversation options contain **Pin**, **Rename**, and **Delete**; search and page/screen filtering remain in history.
- The header's **Full page** control reopens the current saved conversation. Unsent text and a first answer still being prepared are not transferred; wait for that answer before expanding. Conversations remain private to their owner.
- Request errors remain visible whether you are viewing history or the conversation.
- **Latest messages** appears when you scroll away from the latest answer. It returns to the end of the conversation and focuses the message box.
- Open **History options** (the three dots beside **Your conversations**) to find **Delete all history**. Deletion still requires confirmation.
- On supported editors, **Use my current unsaved edits when needed** controls whether the assistant may request editor details. Reading those details still requires your approval.
- Escape closes conversation options first, then history, then the drawer. Keyboard focus stays inside the open drawer and returns to the launcher when closed.

The interface remains PHP-rendered with scoped admin CSS and JavaScript; this refresh does not add ACF fields or change the public frontend. Deploy the plugin, its `includes/website-help.php` helper, both help assets, and the updated handbook together. New replies retain paragraphs and indentation when saved and reopened. Existing saved replies can show inline formatting, but paragraph breaks already removed by older versions cannot be recovered automatically. UI regression tests use the actual PHP markup with translation expressions replaced locally, synthetic JSON conversations, and mocked AJAX responses:

```bash
npm run test -- app/test/website-help/__tests__/website-help.test.ts
npm run test:e2e -- e2e/website-help.spec.ts --reporter=line
npm run test:wordpress
```

The browser tests also load the actual help CSS and check compact-screen layout, unchanged height on first typing, upward growth with fixed arrow coordinates, draft resizing when the available width changes, formatted replies, history-menu fit, saved-conversation expansion, and keyboard focus handling with and without editor context. Playwright checks dev-server readiness with a static asset because the CMS-driven home page can return 404 without WordPress content. The PHP tests check that formatting survives provider parsing and history sanitization while HTML and raw URLs are still removed. These synthetic tests do not replace a real WordPress smoke check. Check both drawer and full-page modes after deployment, including mobile, keyboard navigation, context approval, history operations, and answer reporting.

The feature is disabled when `SZ_WEBSITE_HELP_ENABLED` is absent or false. Configure it through the WordPress container environment, never in source code:

```env
SZ_WEBSITE_HELP_ENABLED=false
SZ_OPENAI_API_KEY=replace-with-a-dedicated-project-key
SZ_OPENAI_MODEL=gpt-5-mini
SZ_WEBSITE_HELP_REPORT_EMAIL=replace-with-the-private-support-mailbox
```

Use a dedicated Studio Zanetti OpenAI project and project service account under the existing organization/billing account. Disable provider input/output sharing for the production project. The server sends Responses API requests with `store: false`; the API key remains in PHP and is never localized to the browser.

Answer reporting also requires the existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `SMTP_FROM_HEADER_EMAIL`, and `SMTP_HELO_NAME` settings. The flag appears beside assistant answers only when both the private report mailbox and SMTP relay are configured. After confirmation, the server re-reads the owned conversation and emails the stored prompt and response; it never accepts transcript text from the browser. Each answer can be reported once.

#### Privacy and history

- Each conversation is a private `sz_help_thread` owned by one WordPress user. Administrator capability does not bypass that ownership check.
- Local transcripts remain until that user deletes one conversation or all of their history.
- Provider context is bounded to recent turns plus question-relevant older turns.
- On recognized editors, the initial request sends only screen metadata. The model may request one narrow, read-only scope at a time, for at most two rounds.
- The browser extracts only the server-approved scope; PHP verifies and sanitizes it again. Raw editor snapshots are never retained in history.
- Recipient addresses, personal default values, VSCO mapping/configuration, credentials, nonces, cookies, file data, and raw URLs are excluded.
- Reporting an inaccurate answer sends its stored question and response to the configured private support mailbox. It does not send raw editor context.

#### Handbook maintenance

The source of truth is `mu-plugins/website-help/manifest.php` plus the Markdown files under `mu-plugins/website-help/topics/`. Topics are deliberately granular for predictable retrieval, but each topic must still be a complete operational playbook rather than a one-step summary. Cover the workflow's scope, prerequisites, exact steps, local-versus-shared consequences, checks, common mistakes, recovery or escalation, and the next questions an editor may not know to ask.

Create a separate topic when a subject has a distinct user intent, risk boundary, or destination screen. Do not split one workflow into fragments that only make sense together. Retrieval uses the current question plus a bounded set of recent user questions so short follow-ups retain their subject; it sends only complete topics that fit the context budget.

Update the handbook whenever an editor capability, field, consequence, or recovery path changes. Keep IDs stable, increment `knowledge_version`, update `updated_at`, add a natural-language retrieval case for new intents, and run `npm run test:wordpress` after every change.

#### Rotation and troubleshooting

Rotate the key by creating a replacement in the same dedicated OpenAI project, updating `SZ_OPENAI_API_KEY` on the VPS, recreating only the WordPress service, verifying one answer, and then revoking the old key. Never print either key during validation.

If the assistant is unavailable, confirm the enable flag, key, model, outbound HTTPS access, and OpenAI project limits. Disabling the flag removes the UI and blocks all assistant AJAX/provider calls without deleting history or changing public website behavior.

#### Production rollout

1. Deploy the additive MU-plugin files with `SZ_WEBSITE_HELP_ENABLED=false`.
2. Confirm normal page, gallery, menu, preview, Site Settings, and SEO behavior.
3. Add the dedicated key/model and private report mailbox to the VPS environment. The production workflow stages the versioned Compose file, verifies that the live file still matches the last deployed checksum, and only then applies WordPress configuration changes. Unexpected VPS edits stop deployment instead of being overwritten. The secret-bearing VPS `.env` remains server-managed and is never copied from the repository.
4. Recreate only the WordPress service and validate as an Administrator.
5. Set `SZ_WEBSITE_HELP_ENABLED=true`, recreate only WordPress, then validate as an Editor.
6. Roll back immediately by setting the flag to false. Stored help history remains available for a later re-enable or user deletion.

### Website analytics dashboard

Deploy `sz-analytics.php`, `includes/analytics-validation.php`, `includes/analytics-reporting.php`, `includes/analytics-dashboard.php`, `assets/analytics.css` and `assets/analytics.js` together. Open **Analytics** for daily traffic charts, enquiry activity, report tabs and quick 7, 30 and 90 day ranges. Click the date range to choose custom dates. Reporting dates use UTC. The selected report stays open when dates change; archived reports show retained history independently of the date filter. The Sessions card opens the session list and individual journeys.

The traffic chart switches between page views and daily sessions, fills unrecorded dates with zero, and offers exact daily figures in a disclosure. The enquiry rate counts distinct daily sessions with a submitted form, so repeated submissions in one session do not inflate it. Traffic sources combine a referrer list with a channel mix; shares use the sessions in the listed referrers (up to 50).

Report tabs support arrow keys, Home and End, direct links and browser history. Without JavaScript, all reports remain visible. Tables scroll horizontally on smaller screens. This interface uses the existing analytics collection and retention rules.

Browser checks render the actual PHP templates with synthetic data and load the real analytics CSS and JavaScript. They require PHP on your PATH, or a `PHP_BINARY` environment variable pointing to the executable:

```bash
npx playwright test e2e/analytics.spec.ts
```

### Lightweight WordPress tests

Run all pure-PHP validation and audit fixtures with:

```bash
npm run test:wordpress
```

The command requires a local `php` executable. It does not bootstrap WordPress or connect to production data.

---

## Developing Locally

Run the mock WordPress server instead of a real WordPress installation:

```bash
# Terminal 1 — mock WordPress API
npm run dev:mock

# Terminal 2 — React Router dev server
WORDPRESS_URL=http://localhost:8787 npm run dev
```

The mock server simulates all the endpoints including the nav menu and preview.

---

## Troubleshooting

| Problem                       | Solution                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| Navbar shows fallback links   | Check that a menu is assigned to the "Primary Navigation" location in Appearance → Menus              |
| Preview shows "404 Not Found" | Verify `SZ_PREVIEW_SECRET` matches in both `wp-config.php` and the frontend `.env`                    |
| ACF fields not in REST API    | Ensure "Show in REST API" is enabled on each ACF field group, or install the "ACF to REST API" plugin |
| Pages list looks squished     | The mu-plugin adds CSS fixes. Make sure `sz-headless.php` is in `wp-content/mu-plugins/`              |
| Posts menu is missing         | Confirm the current `sz-headless.php` is deployed; Posts are supported for the blog                  |
| Website Help is missing       | Confirm `SZ_WEBSITE_HELP_ENABLED=true`, then recreate only the WordPress service                      |
| Website Help cannot answer    | Confirm the dedicated key/model and OpenAI project limits without printing the key                    |
