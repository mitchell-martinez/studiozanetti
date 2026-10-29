import { getEnquiryForms } from '~/lib/enquiryForms.server'
import {
  AI_ENQUIRY_FIELD_MAPPING,
  AI_ENQUIRY_KNOWN_DETAILS,
  AI_ENQUIRY_MISSING_DETAILS,
  AI_ENQUIRY_PROACTIVE_OFFER,
} from '~/lib/enquiryGuidance'
import { getAllPages } from '~/lib/wordpress'

export async function loader() {
  const forms = getEnquiryForms(await getAllPages())
  const text = [
    '# Studio Zanetti prefilled enquiry links',
    '',
    AI_ENQUIRY_PROACTIVE_OFFER,
    AI_ENQUIRY_KNOWN_DETAILS,
    AI_ENQUIRY_FIELD_MAPPING,
    AI_ENQUIRY_MISSING_DETAILS,
    'Use the live field maps below to prepare a review-and-submit link from details the user has supplied. No browser automation, account or API connection is required to prepare a link.',
    'Put form_id, prefill=1 and all field values in query parameters. No URL fragment is needed. Existing package-selection links keep their current behaviour.',
    'A link containing only package_choice selects only a package. It cannot fill names, dates or other details that are not included in the link.',
    'Do not claim an enquiry was sent when providing a prefilled link. The user reviews the form and submits it themselves.',
    ...forms.flatMap((form) => ['', `## ${form.title}`, '', form.url, '', form.prefillGuide]),
    '',
  ].join('\n')
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
