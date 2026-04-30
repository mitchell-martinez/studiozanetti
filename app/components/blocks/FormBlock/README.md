# Form Block

Create configurable enquiry forms that send submissions from the React app over SMTP.

## WordPress Fields

| Field | Type | Purpose |
| --- | --- | --- |
| Form ID | Text | Required stable identifier used by the secure submit route. Keep it unique on each page. |
| Heading | Text | Optional visible title above the form. |
| Heading Alignment | Select | Left, centre, or right heading alignment. |
| Heading Level | Select | Semantic tag from `h1` to `h6`. |
| Intro | WYSIWYG | Optional intro copy above the fields. |
| Submit Text | Text | Button label, for example `Send message`. |
| Submit Alignment | Select | Left or centre button alignment. |
| Success Message | Textarea | In-page confirmation text shown after a successful submit. |
| Email Subject | Text | Subject line used for the outgoing email. |
| Email To | Email | Recipient address used by the server-side WordPress lookup. |
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

## Important Setup Notes

- `Email To` and `Email Subject` are not trusted from the browser. The submit route performs a fresh WordPress lookup using the current page path plus `Form ID`.
- `Form ID` must stay stable after publishing, or submissions will stop resolving to the correct server-side form config.
- Choice fields should use short machine-safe values such as `email`, `phone`, or `wedding`.
- Use the checkbox field for consent text such as privacy acknowledgement.

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