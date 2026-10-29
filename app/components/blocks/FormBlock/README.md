# Form Block

Create configurable enquiry forms that send submissions from the React app to email (SMTP), VSCO Workspace, or both.

## Enquiries through AI assistants

The public page renderer inserts a visible AI enquiry offer immediately after the first non-empty pricing table, before subsequent enquiry blocks. Main wedding/corporate landing pages and pages with a configured service reference show a shorter offer after the hero (or their first block), even when they have no enquiry form. The offer appears once per page and remains visible in server-rendered HTML. It links directly to `/enquiry-links.txt` and encourages assistants to offer a personalised link when comparing or recommending Studio Zanetti.

Each available form includes an expandable “Enquiring with an AI assistant?” section in its server-rendered HTML. It permits submission on a user's behalf with their permission, explains how to collect and review details, and requires a confirmed result before reporting success. Assistants without browser interaction can provide the form link and a draft instead. These instructions do not grant tools to an assistant or guarantee support in every chat product.

Link preparation does not require the user's name, email or exact event date. The offer, form guidance, `llms.txt` and plain-text guide all instruct assistants to leave unknown fields empty and let the customer finish privately on the website. Missing required fields are collected only when actually submitting an enquiry. The page content offers this capability; it cannot guarantee that an independent AI session will suggest it.

Forms have an accessible name and native required attributes on individual fields, including an optional email field when a copy is requested. The `/llms.txt` index includes the same guidance and links directly to each configured, available form on public pages. Form configuration changes in WordPress automatically update that index; no separate API or customer connection is needed for the browser workflow.

The submission route accepts valid enquiries regardless of user-agent. Honeypots, timing checks, rate limits, trusted server-side configuration and field validation still apply. Honeypot hits return an error instead of a fake success. A successful response requires at least one studio delivery channel to accept the enquiry. The frontend requires `success: true` before showing confirmation; `emailDelivered` is used for email conversion tracking. Enquiry delivery does not confirm availability or create a booking.

For an end-to-end check, use a staging form and test email/VSCO destinations. Ask a browser-capable assistant to fill a wedding or corporate enquiry, review the details and authorise submission. Verify the enquiry arrived once, and separately check missing fields, wait/rate-limit messages and delivery failures. Do not send test enquiries to the live studio inbox.

## Prefilled enquiry links

An assistant that can read the website can prepare a link using the user's supplied details. It does not need browser interaction or an API connection. `/enquiry-links.txt` is a directly linked plain-text guide with all current form URLs and field maps. It and `/llms.txt` use the same WordPress configuration as the form's expandable guidance. If a search result is stale or omits the collapsed field map, give the assistant the direct guide URL.

Put the form ID, `prefill=1`, and all field values in query parameters. No URL fragment is required:

```text
/get-in-touch?form_id=contact-enquiry&prefill=1&name=Alex%20Example&email=alex%2Bevents%40example.com&phone=%2B61%20412%20345%20678
```

Opening the link fills only the named form, scrolls to it and asks the user to review and submit. Opening or previewing the URL never sends an enquiry. `prefill=1` starts a new draft and clears details from the previous draft. Personal details are included in the page request and can appear in server logs, referrers, and browser/chat history. Include only details needed for the enquiry and share the link with its user.

Pricing buttons keep their existing package-only query links without `prefill=1`. These update the selected package without clearing entered contact details or showing the personal-prefill notice. Clicking the same button again reapplies its selection even if the user changed the dropdown in between. A package link cannot fill personal details that are not present in its URL.

- Percent-encode each field identifier and value. Encode a literal `+` as `%2B`, an ampersand as `%26`, and a line break as `%0A`; `URLSearchParams` handles this automatically.
- Use each select/radio option's actual value, not its display label. Repeat a checkbox field identifier for multiple selections, for example `interests=photos&interests=album`.
- Dates use `YYYY-MM-DD`, times use 24-hour `HH:mm`, and local date-times use `YYYY-MM-DDTHH:mm`.
- Unknown fields and invalid choices are ignored. Hidden spam traps and the generated email-copy checkbox cannot be set through a prefilled link. Consent/marketing fields are included only if the user chose them.
- Missing required fields are collected on the form. An assistant must not invent values to make a link complete.
- Previously shared fragment links remain supported. An explicit query-string `form_id` takes precedence over an old fragment prefill. Existing query links without `prefill=1` retain their merge behaviour.

## WordPress Fields

| Field | Type | Purpose |
| --- | --- | --- |
| Form ID | Text | Required stable identifier used by the secure submit route. It is also applied as the section HTML `id` so links like `/page#contact-enquiry` jump to the form. Keep it unique on each page. |
| Heading | Text | Optional visible title above the form. |
| Heading Alignment | Select | Left, centre, or right heading alignment. |
| Form Alignment | Select | Left or centre alignment for the form panel within the page section. |
| Heading Level | Select | Semantic tag from `h1` to `h6`. |
| Intro | WYSIWYG | Optional intro copy above the fields. |
| Submit Text | Text | Button label, for example `Send message`. |
| Submit Alignment | Select | Left or centre button alignment. |
| Success Message | Textarea | In-page confirmation text shown after a successful submit. |
| Send Enquiry To | Select | Delivery target: `Email`, `VSCO Workspace`, or `Email + VSCO Workspace`. |
| Email Subject | Text | Subject line used for outgoing email delivery. Required when sending to email. |
| Email To | Email | Recipient address used for outgoing email delivery. Required when sending to email. |
| Offer Submitter Email Copy | Toggle | Show a checkbox at the bottom of the form so submitters can request an emailed copy of what they submitted. |
| VSCO Job Type | Select | Required when VSCO delivery is enabled. Uses a fixed dropdown that must match VSCO Workspace job types. |
| VSCO Lead Source | Text | Optional default `Source` value sent to VSCO. |
| VSCO Brand | Text | Optional brand name or brand ID sent to VSCO. |
| VSCO Email Notification | Toggle | Enable/disable VSCO's own lead notification email for this form. |
| Fields | Repeater | Add each form field row and choose its type, label, required state, help text, and options. |

## Supported Field Types

- `text`
- `email`
- `tel`
- `number`
- `date`
- `time`
- `datetime-local`
- `textarea`
- `select`
- `radio`
- `checkbox`

`checkbox` fields now behave as a checkbox group. Add options in the `Options` repeater, and each option is rendered as a stacked checkbox in the form.

`number` fields are treated as non-negative values. If no custom minimum is set, the form enforces a minimum of `0`.

Each field row also has an optional `VSCO Field Key` value.

Email rows also have an optional `Use For Submitter Copy` toggle.

- If the form has only one Email field, that field is used automatically.
- If the form has more than one Email field, enable it on the one that should receive the submitter copy.
- That chosen Email field is used when the submitter requests their copy.
- Publishing is blocked if more than one Email row is selected for submitter copy delivery.

- Leave blank to send the field using `Field ID` as the VSCO key.
- Set it when VSCO requires a specific key name (for example `FirstName`, `LastName`, `Email`, `JobType`, `EventDate`, `Source`).

Every form includes a protected default Name row:

- It is automatically created in the WordPress editor UI for new forms when needed.
- It cannot be removed from the editor UI (the remove control is hidden on that row).
- It is always required (`Required` is forced on and hidden for that row).
- `Field ID` is locked to `name`, `Field Type` is locked to `Text`, and `VSCO Field Key` is locked to `FirstName`.
- It always maps to VSCO `FirstName`.
- The admin can change only the visible `Label`. All other fields in the form continue to save normally.

Publishing is also blocked if the form data becomes invalid behind the editor UI, for example if the reserved Name row is removed, duplicated, or its `FirstName` mapping is reused elsewhere.

## Important Setup Notes

- `Email To` and `Email Subject` are not trusted from the browser. The submit route performs a fresh WordPress lookup using the current page path plus `Form ID`.
- `Form ID` is also used as the outer section anchor id for hash links such as `/page#contact-enquiry`.
- Use `/page?form_id=contact-enquiry&prefill=1&FIELD_ID=VALUE` for new enquiry drafts. Existing package links such as `/page?form_id=contact-enquiry&package_choice=short_and_sweet#contact-enquiry` still work; their final anchor is optional.
- `Offer Submitter Email Copy` only affects whether the extra checkbox appears at the bottom of the public form. The checkbox itself is generated by the React app and is not a normal repeater row.
- When `Offer Submitter Email Copy` is enabled, the form must include at least one Email field.
- If the form includes more than one Email field, one of them must enable `Use For Submitter Copy`.
- When a submitter ticks the checkbox, that designated Email field becomes required for that submission even if it is otherwise optional.
- The submitter copy email includes only the submitted labels and values. It does not include internal routing details such as page path, page title, or form ID.
- The studio notification email includes approximate first-party visit context: original source, starting page, coarse timezone-derived region, page views, time on site, and time on the enquiry page.
- A visit continues across ordinary same-tab navigation and reloads, then resets after 30 minutes of inactivity or a fresh arrival from an external source.
- Visit context is never included in the submitter copy or sent to VSCO. It excludes query parameters, raw referrer URLs, raw timezones, IP addresses, and visitor/session identifiers.
- `Form ID` must stay stable after publishing, or submissions will stop resolving to the correct server-side form config.
- Choice fields should use short machine-safe values such as `email`, `phone`, or `wedding`.
- Number fields use a minimum of `0` by default and should only be used for non-negative values such as attendees, quantities, or durations.
- For checkbox groups, each option is included in the email output as `Option Label: True/False`.
- Use checkbox groups for consent toggles, preferences, and multi-select interests.
- Use `Form Alignment` to center the entire form panel on the page when needed.
- If `Send Enquiry To` includes VSCO, each submission is posted to VSCO Workspace New Lead API (`/webservice/create-lead/<studioId>`).
- If `Send Enquiry To` is `Email + VSCO Workspace`, each delivery channel is attempted independently and the submission still succeeds when either channel delivers successfully.
- Analytics records a submitted-form conversion only after the studio notification email is accepted by the configured SMTP server. Rejected submissions and VSCO-only delivery do not count as submitted forms.
- VSCO requires `FirstName` and `JobType`. Map these through `VSCO Field Key` or set `VSCO Job Type` as a fallback.
- If submission fails or the form configuration is invalid, the frontend provides a direct `info@studiozanetti.com.au` email link so the visitor can still make contact.

Fixed `VSCO Job Type` dropdown options:

- `Bridal`
- `Christening`
- `Couple`
- `Engagement`
- `Engagement Party`
- `Event`
- `Family`
- `Headshots`
- `Holiday`
- `Portraits`
- `Studio`
- `Trash The Dress`
- `Wedding`

## SMTP Requirements

The React server must have SMTP env vars configured:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

Optional sender overrides:

- `SMTP_FROM_HEADER_EMAIL` or `FORM_FROM_EMAIL` to control the visible `From` address shown to recipients.
- `SMTP_ENVELOPE_FROM_EMAIL` to control the SMTP envelope sender separately when needed.

The route also supports in-memory throttling with:

- `FORM_RATE_LIMIT_WINDOW_MS`
- `FORM_RATE_LIMIT_MAX_REQUESTS`

For VSCO delivery, configure:

- `VSCO_WORKSPACE_STUDIO_ID`
- `VSCO_WORKSPACE_SECRET_KEY`
- `VSCO_WORKSPACE_API_BASE` (optional, defaults to `https://workspace.vsco.co`)
- `VSCO_WORKSPACE_TIMEOUT_MS` (optional, defaults to `10000`)
