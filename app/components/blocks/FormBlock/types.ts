import type { FormBlock as FormBlockType } from '~/types/wordpress'

export interface FormBlockProps {
  block: FormBlockType
  /** The page renderer shows this compact discovery note only on the first available form. */
  showEnquiryGuide?: boolean
}
