# Form Block

Create configurable enquiry forms that send submissions from the React app to email (SMTP), VSCO Workspace, or both.

## WordPress Fields

| Field | Type | Purpose |
| --- | --- | --- |
| Form ID | Text | Required stable identifier used by the secure submit route. Keep it unique on each page. |
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

Each field row also has an optional `VSCO Field Key` value.

- Leave blank to send the field using `Field ID` as the VSCO key.
- Set it when VSCO requires a specific key name (for example `FirstName`, `LastName`, `Email`, `JobType`, `EventDate`, `Source`).

Every form includes a protected default Name row:

- It is automatically created in new forms.
- If existing rows are missing a `field_id` of `name` + `VSCO Field Key` of `FirstName`, the row is auto-restored.
- It cannot be removed (no remove option is shown for that row).
- It always maps to VSCO `FirstName`.
- The admin can still rename the visible Label and reorder the row position.

## Important Setup Notes

- `Email To` and `Email Subject` are not trusted from the browser. The submit route performs a fresh WordPress lookup using the current page path plus `Form ID`.
- `Form ID` must stay stable after publishing, or submissions will stop resolving to the correct server-side form config.
- Choice fields should use short machine-safe values such as `email`, `phone`, or `wedding`.
- For checkbox groups, each option is included in the email output as `Option Label: True/False`.
- Use checkbox groups for consent toggles, preferences, and multi-select interests.
- Use `Form Alignment` to center the entire form panel on the page when needed.
- If `Send Enquiry To` includes VSCO, each submission is posted to VSCO Workspace New Lead API (`/webservice/create-lead/<studioId>`).
- VSCO requires `FirstName` and `JobType`. Map these through `VSCO Field Key` or set `VSCO Job Type` as a fallback.

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
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

The route also supports in-memory throttling with:

- `FORM_RATE_LIMIT_WINDOW_MS`
- `FORM_RATE_LIMIT_MAX_REQUESTS`

For VSCO delivery, configure:

- `VSCO_WORKSPACE_STUDIO_ID`
- `VSCO_WORKSPACE_SECRET_KEY`
- `VSCO_WORKSPACE_API_BASE` (optional, defaults to `https://workspace.vsco.co`)
- `VSCO_WORKSPACE_TIMEOUT_MS` (optional, defaults to `10000`)