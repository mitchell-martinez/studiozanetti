/**
 * Local-lab composition data.
 *
 * All individual block/component mock data lives in `__mocks__/*.json` files
 * inside each component folder. This barrel imports those JSON fixtures and
 * assembles the two full-page block compositions used by the local-lab route
 * and composed Storybook stories.
 */

import type { ContentBlock } from '~/types/wordpress'

import biographyBlock from '~/components/blocks/BiographyBlock/__mocks__/biographyBlock.json'
import faqBlock from '~/components/blocks/FaqAccordionBlock/__mocks__/faqAccordionBlock.json'
import galleryCategoriesBlock from '~/components/blocks/GalleryCategoriesBlock/__mocks__/galleryCategoriesBlock.json'
import heroBlock from '~/components/blocks/HeroBlock/__mocks__/heroBlock.json'
import imageTextBlock from '~/components/blocks/ImageTextBlock/__mocks__/imageTextBlock.json'
import pillarBlock from '~/components/blocks/PillarGridBlock/__mocks__/pillarGridBlock.json'
import pricingBlock from '~/components/blocks/PricingPackagesBlock/__mocks__/pricingPackagesBlock.json'
import processBlock from '~/components/blocks/ProcessTimelineBlock/__mocks__/processTimelineBlock.json'
import servicesBlock from '~/components/blocks/ServicesGridBlock/__mocks__/servicesGridBlock.json'
import testimonialBlock from '~/components/blocks/TestimonialCarouselBlock/__mocks__/testimonialCarouselBlock.json'
import textBlock from '~/components/blocks/TextBlock/__mocks__/textBlock.json'

export const fullPageBlocksA: ContentBlock[] = [
  heroBlock as ContentBlock,
  textBlock as ContentBlock,
  imageTextBlock as ContentBlock,
  servicesBlock as ContentBlock,
  testimonialBlock as ContentBlock,
  faqBlock as ContentBlock,
]

export const fullPageBlocksB: ContentBlock[] = [
  heroBlock as ContentBlock,
  biographyBlock as ContentBlock,
  pillarBlock as ContentBlock,
  processBlock as ContentBlock,
  pricingBlock as ContentBlock,
  galleryCategoriesBlock as ContentBlock,
]
