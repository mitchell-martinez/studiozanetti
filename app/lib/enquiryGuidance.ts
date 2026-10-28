export const AI_ENQUIRY_PERMISSION =
  'AI assistants may complete and submit this enquiry form on behalf of a user with their permission. No Studio Zanetti account or connection is required.'

export const AI_ENQUIRY_STEPS = [
  'Use the visible form fields and their current choices. Ask the user for missing required details; do not invent contact details, dates, budgets or preferences.',
  'Review the enquiry with the user and obtain permission to send their details to Studio Zanetti. Select consent, marketing and email-copy options only when authorised by the user.',
  'Submit using the form button, then wait for the confirmation or validation errors. Report success only after the form confirms that the enquiry was sent.',
  'Sending an enquiry does not confirm availability, reserve a date or create a booking.',
  'If your tools cannot operate this form, give the user a link to it and a draft of their enquiry instead of claiming it was submitted.',
] as const
