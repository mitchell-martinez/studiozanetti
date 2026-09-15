# Forms and enquiry delivery

Forms are Page Blocks. They contain visitor-facing wording and fields plus private delivery configuration. Treat changes as functional work: previewing appearance is necessary, but a controlled test submission is the only way to confirm delivery.

## Safe form setup

1. Keep the **Form ID** unique on the page and stable after publication. It also acts as the section anchor for links such as `/page#contact-enquiry`; changing it can break links and secure submission lookup.
2. Set the heading and semantic heading level, introduction, submit label, and success message.
3. Choose the approved **Send Enquiry To** mode: Email, VSCO Workspace, or both. Do not change recipient or integration fields merely to experiment.
4. Add fields in the order visitors should complete them. Every row needs a unique machine-safe **Field ID**, a visitor-facing label, a supported field type, and an intentional Required setting.
5. Keep exactly one required Text field with Field ID `name`. If VSCO mapping is configured, that same row maps to `FirstName`.
6. For select, radio, or checkbox fields, give each option a clear label and a stable machine-safe value.
7. Preview the form, then submit non-sensitive test data and confirm the intended destination received it.

Supported visitor field types are Text, Email, Telephone, Number, Date, Time, Date & Time, Textarea, Select Dropdown, Radio Group, and Checkbox Group. Use help text for constraints visitors genuinely need. Placeholder text is not a substitute for a visible label.

## Email copies and delivery

**Offer Submitter Email Copy** displays an opt-in checkbox and requires an Email field. If there is one Email field it is used automatically; with several, choose exactly one **Use This One For Customer Copy** field. Do not use a non-email field for that purpose.

Email recipient, email subject, VSCO job type/source/brand, VSCO field mappings, and notification controls affect operations. Website Help deliberately does not read or repeat private recipient addresses, default personal values, mapping values, credentials, or submitted enquiries.

## Common failure checks

- A renamed Form ID no longer matches the trusted saved configuration.
- Field IDs are missing or duplicated.
- The required `name` row is missing, optional, or the wrong type.
- A choice field has incomplete or duplicate option values.
- Customer-copy delivery has no eligible Email field or several selected fields.
- The chosen delivery mode is missing required server-side configuration.

Do not test with a real customer's information. Website Help cannot submit a form, inspect deliveries or logs, reveal private settings, or create an integration. Contact the webmaster when delivery fails, the form reports a configuration error, a destination must change, or available field types cannot represent the requirement.