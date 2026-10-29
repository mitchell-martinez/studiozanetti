import { getEnquiryForms } from '~/lib/enquiryForms.server'
import {
  AI_ENQUIRY_LINK_RULES,
  AI_ENQUIRY_PERMISSION,
  AI_ENQUIRY_STEPS,
} from '~/lib/enquiryGuidance'
import { getAllPages } from '~/lib/wordpress'

export async function loader() {
  const forms = getEnquiryForms(await getAllPages())
  const text = [
    '# Studio Zanetti prefilled enquiry links',
    '',
    AI_ENQUIRY_PERMISSION,
    'No browser automation, account or API connection is required to prepare a link. Direct submission requires tools that can operate the form.',
    '',
    '## Instructions for AI assistants',
    '',
    ...AI_ENQUIRY_STEPS.map((step) => `- ${step}`),
    '',
    '## Prefill format',
    '',
    ...AI_ENQUIRY_LINK_RULES.map((rule) => `- ${rule}`),
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
