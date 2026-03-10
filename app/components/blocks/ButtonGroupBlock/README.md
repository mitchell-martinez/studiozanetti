# ButtonGroupBlock

A flexible block that renders one or more CTA buttons in a horizontal row. Useful for standalone call-to-action sections between content blocks.

## WordPress Setup

This block appears in the **Page Blocks** flexible content field as **"Button Group"**.

### Fields

| Field | Type | Description |
| --- | --- | --- |
| **Buttons** (Repeater) | Repeater | One or more buttons to display |
| ↳ Label | Text | Button text (required) |
| ↳ URL | URL | Button link destination (required) |
| ↳ Variant | Select | `primary` · `secondary` · `outline` · `dark` · `text` |
| ↳ Size | Select | `sm` · `md` · `lg` |
| ↳ Open in New Tab | True/False | Opens the link in a new browser tab |
| **Alignment** | Select | `left` · `center` · `right` — positions the button row |
| **Spacing** | Select | `tight` · `normal` · `loose` — gap between buttons |
| Section Theme | Select | Light · Rose · Champagne · Dark |
| Top Spacing | Select | None · Small · Medium · Large |
| Bottom Spacing | Select | None · Small · Medium · Large |

### Usage Tips

- Use **one button** for a simple standalone CTA between content blocks.
- Use **two buttons** for a primary + secondary action pair (e.g. "Send Enquiry" + "View Gallery").
- The `text` variant renders as a link-style button — useful for subtle secondary actions.
- The `dark` variant uses a rectangular shape rather than a pill.
- Set **Alignment** to "Center" for centred CTA sections (default).

## Accessibility

- All buttons have a minimum tap target of 44×44px.
- Focus-visible outlines follow WCAG 2.1 AA.
- External links automatically include `rel="noopener noreferrer"` and open in a new tab.
