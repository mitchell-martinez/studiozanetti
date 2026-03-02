import { useCallback, useState } from 'react'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { Form, useActionData, useNavigation } from 'react-router'
import styles from './contact.module.scss'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormFields {
  name: string
  email: string
  message: string
}

interface ActionData {
  success?: true
  errors?: Partial<Record<keyof FormFields, string>>
}

// ─── Action (runs server-side; handles form submission) ───────────────────────
export async function action({ request }: ActionFunctionArgs): Promise<ActionData> {
  const data = await request.formData()
  const name = String(data.get('name') ?? '').trim()
  const email = String(data.get('email') ?? '').trim()
  const message = String(data.get('message') ?? '').trim()

  const errors: ActionData['errors'] = {}
  if (!name) errors.name = 'Name is required.'
  if (!email) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'
  if (!message) errors.message = 'Message is required.'

  if (Object.keys(errors).length > 0) return { errors }

  // TODO: Send email / persist to backend once API is available
  return { success: true }
}

export const meta: MetaFunction = () => [
  { title: 'Contact | Studio Zanetti' },
  {
    name: 'description',
    content:
      "Get in touch with Studio Zanetti to book a session, discuss a project, or ask a question. We'd love to hear from you.",
  },
  { property: 'og:title', content: 'Contact | Studio Zanetti' },
  { name: 'twitter:card', content: 'summary_large_image' },
]

// ─── Contact info ─────────────────────────────────────────────────────────────
interface ContactItem {
  label: string
  value: string
  href?: string
}

const CONTACT_ITEMS: ContactItem[] = [
  {
    label: 'Email',
    value: 'hello@studiozanetti.com',
    href: 'mailto:hello@studiozanetti.com',
  },
  { label: 'Phone', value: '+39 055 123 4567', href: 'tel:+390551234567' },
  { label: 'Studio', value: 'Via della Vigna Nuova 18, Florence, Italy' },
  { label: 'Hours', value: 'Mon–Sat, 9:00am – 6:00pm' },
]

// ─── Contact form ─────────────────────────────────────────────────────────────
interface ContactFormProps {
  errors?: ActionData['errors']
  isPending: boolean
}

const ContactForm = ({ errors, isPending }: ContactFormProps) => {
  // Optimistically clear a field's error as the user types (client-only UX)
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, true>>>({})
  const handleTouch = useCallback((name: keyof FormFields) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  return (
    <Form method="post" className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          Full Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Your full name"
          className={`${styles.input} ${errors?.name && !touched.name ? styles.inputError : ''}`}
          aria-describedby={errors?.name && !touched.name ? 'name-error' : undefined}
          aria-invalid={!!(errors?.name && !touched.name)}
          onChange={() => handleTouch('name')}
          disabled={isPending}
        />
        {errors?.name && !touched.name && (
          <span id="name-error" className={styles.errorMsg} role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="your@email.com"
          className={`${styles.input} ${errors?.email && !touched.email ? styles.inputError : ''}`}
          aria-describedby={errors?.email && !touched.email ? 'email-error' : undefined}
          aria-invalid={!!(errors?.email && !touched.email)}
          onChange={() => handleTouch('email')}
          disabled={isPending}
        />
        {errors?.email && !touched.email && (
          <span id="email-error" className={styles.errorMsg} role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="Tell us about your project or enquiry…"
          rows={6}
          className={`${styles.textarea} ${errors?.message && !touched.message ? styles.inputError : ''}`}
          aria-describedby={errors?.message && !touched.message ? 'message-error' : undefined}
          aria-invalid={!!(errors?.message && !touched.message)}
          onChange={() => handleTouch('message')}
          disabled={isPending}
        />
        {errors?.message && !touched.message && (
          <span id="message-error" className={styles.errorMsg} role="alert">
            {errors.message}
          </span>
        )}
      </div>

      <button type="submit" className={styles.submitBtn} disabled={isPending}>
        {isPending ? 'Sending…' : 'Send Message'}
      </button>
    </Form>
  )
}

// ─── Success state ───────────────────────────────────────────────────────────
const SuccessMessage = () => (
  <div className={styles.success} role="status">
    <svg
      className={styles.successIcon}
      viewBox="0 0 24 24"
      width="48"
      height="48"
      aria-hidden="true"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth={1.5}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
      <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <h3>Message Sent!</h3>
    <p>Thank you for reaching out. We'll be in touch within 24 hours.</p>
  </div>
)

// ─── Route component ──────────────────────────────────────────────────────────
const Contact = () => {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isPending = navigation.state === 'submitting'

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Contact</h1>
        <p className={styles.pageSubtitle}>Let's create something beautiful together</p>
      </header>

      <section className={styles.content} aria-labelledby="contact-heading">
        <div className={styles.inner}>
          <div className={styles.details}>
            <h2 id="contact-heading" className={styles.detailsHeading}>
              Get in Touch
            </h2>
            <p className={styles.detailsIntro}>
              Ready to book a session or have a question? We'd love to hear from you. Fill in the
              form or reach us directly using the details below.
            </p>

            <address className={styles.contactInfo}>
              {CONTACT_ITEMS.map(({ label, value, href }) => (
                <div key={label} className={styles.contactItem}>
                  <span className={styles.contactLabel}>{label}</span>
                  {href ? (
                    <a href={href} className={styles.contactValue}>
                      {value}
                    </a>
                  ) : (
                    <span className={styles.contactValue}>{value}</span>
                  )}
                </div>
              ))}
            </address>
          </div>

          <div className={styles.formWrapper}>
            {actionData?.success ? (
              <SuccessMessage />
            ) : (
              <ContactForm errors={actionData?.errors} isPending={isPending} />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
