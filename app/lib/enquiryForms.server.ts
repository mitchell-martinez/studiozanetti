import type { WPPage } from '~/types/wordpress'
import { getFormPrefillGuide } from './enquiryGuidance'
import { validateFormConfiguration } from './formConfiguration'
import { stripHtml } from './html'
import { toCanonicalUrl } from './seo'
import { buildPagePaths } from './wordpress'

export function getEnquiryForms(pages: WPPage[]) {
  const paths = buildPagePaths(pages)
  return pages
    .filter((page) => !page.acf?.container_only)
    .flatMap((page) => {
      const path = page.slug === 'home' ? '/' : `/${paths.get(page.id) ?? page.slug}`
      return (page.acf?.blocks ?? []).flatMap((block) => {
        if (
          block.acf_fc_layout !== 'form_block' ||
          !block.form_id?.trim() ||
          !Array.isArray(block.fields) ||
          validateFormConfiguration(block).length > 0
        )
          return []
        const pageUrl = toCanonicalUrl(path)
        return [
          {
            title: stripHtml(block.heading || `${page.title.rendered} enquiry`),
            url: `${pageUrl}?form_id=${encodeURIComponent(block.form_id.trim())}`,
            description:
              'Public enquiry form. Read the current fields and choices on the page before submitting.',
            prefillGuide: getFormPrefillGuide(block, pageUrl),
          },
        ]
      })
    })
    .sort((left, right) => left.url.localeCompare(right.url))
}
