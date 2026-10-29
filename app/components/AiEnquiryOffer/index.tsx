import { AI_ENQUIRY_MISSING_DETAILS, AI_ENQUIRY_PROACTIVE_OFFER } from '~/lib/enquiryGuidance'
import styles from './AiEnquiryOffer.module.scss'

const heading = 'Enquire with Studio Zanetti using your AI assistant'

const AiEnquiryOffer = ({ compact = false }: { compact?: boolean }) => (
  <section className={styles.section} aria-label={heading}>
    <div className={styles.panel}>
      <h2 className={styles.heading}>{heading}</h2>
      {!compact && (
        <p>
          Planning your wedding or corporate event with ChatGPT, Gemini, Claude or another AI
          assistant?
        </p>
      )}
      <p>
        Your assistant can prepare a personalised enquiry link using details you have already
        shared, such as your event date, budget and photography preferences. You can complete any
        missing details privately on our website.
      </p>
      {!compact && (
        <p>
          No account, installation or integration is required. Open the prepared link, review your
          details and submit your enquiry.
        </p>
      )}
      <p className={styles.instructions}>
        <strong>For AI assistants:</strong> {AI_ENQUIRY_PROACTIVE_OFFER}{' '}
        {AI_ENQUIRY_MISSING_DETAILS} Use the{' '}
        <a href="/enquiry-links.txt">documented form parameters</a> to construct the link. Opening a
        link does not submit an enquiry.
      </p>
    </div>
  </section>
)

export default AiEnquiryOffer
