# PricingPackagesBlock Component

Flexible package display for photography pricing tiers and inclusions. The layout adapts automatically based on the number of packages:

- **4 or fewer** packages → vertical card grid
- **5 or more** packages → full-width horizontal row cards stacked vertically (collapses to vertical cards on mobile)

No configuration needed — just add your packages and the layout adjusts.

## WordPress Admin Setup

1. Edit a page in WordPress.
2. In **Content Blocks** add layout **pricing_packages**.
3. Fill fields:
   - **Heading** (optional)
   - **Subheading** (optional)
   - **Packages** (repeater)
     - **Name** (required) — e.g. "The Essentials"
     - **Price Label** (optional) — e.g. "From $1,980". Displayed inline with the name.
     - **Description** (optional) — short clarifier shown on its own line below the name, e.g. "Digital Only Package"
    - **Pricing Tiers** (optional, WYSIWYG) — pricing options/tiers. In horizontal layout this appears in the **left** column, center-aligned. You can click **Add Media** here to insert an inline image.
    - **Inclusions** (optional, WYSIWYG) — what's included. In horizontal layout this appears in the **right** column, center-aligned. You can click **Add Media** here to insert an inline image.
     - **Tagline** (optional) — a short sentence displayed centered below the columns, e.g. "Perfect for couples looking to capture their special day."
     - **Is Featured** (optional) — highlights the card with accent border and "Most Popular" badge
     - **CTA Text** (optional) — e.g. "Send Enquiry". In horizontal layout this renders as a filled accent button for better contrast.
     - **CTA URL** (optional) — e.g. "/contact"
   - **Section Theme / Spacing** (optional styling controls)

## Layout Behaviour

| Packages | Layout          | Desktop                                                                                                                                                | Mobile                      |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| 1–4      | Grid            | Centered vertical card columns                                                                                                                         | Stacks to single column     |
| 5+       | Horizontal rows | Name + price on one line, clarifier below, pricing (left) + inclusions (right) center-aligned in narrower columns, tagline centered, strong filled CTA | Collapses to vertical cards |

## Notes

- All text is center-aligned for a clean, balanced design.
- Use `Is Featured` to highlight your most popular package — adds an accent border and a "Most Popular" badge.
- Use separate **Pricing Tiers** and **Inclusions** fields for best results with the horizontal layout — they display as side-by-side centered columns on desktop.
- Images inserted into **Pricing Tiers** or **Inclusions** are rendered inline with the rest of the rich text. Add meaningful alt text in WordPress and keep artwork reasonably compact so cards do not become overly tall.
- The **Tagline** field appears centered below the columns with elegant spacing — ideal for "Perfect for…" lines.
- The CTA button in horizontal layout uses a filled accent background for strong contrast and readability.
- Keep package names and pricing labels concise for easy visual scanning in horizontal row mode.
- To jump to a form and preselect a package choice, set the CTA URL to a query-string link such as `/prices?form_id=lgbt-wedding-enquiry&package_choice=short_and_sweet#lgbt-wedding-enquiry`. `form_id` must match the target form block, and `package_choice` must match the select field's `Field ID` plus one of its option values.
