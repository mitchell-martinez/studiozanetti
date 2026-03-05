import type { PricingPackagesBlock } from '~/types/wordpress'

export const mockPricingPackagesBlock: PricingPackagesBlock = {
  acf_fc_layout: 'pricing_packages',
  heading: 'Packages',
  packages: [
    {
      name: 'The Essentials',
      price_label: '$1,980',
      inclusions: '<ul><li>High-res edited images</li></ul>',
      cta_text: 'Send Enquiry',
      cta_url: '/contact',
    },
  ],
}
