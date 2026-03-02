import { useState } from 'react'
import SEO from '../components/SEO'
import styles from './Contact.module.css'

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.'
    if (!form.message.trim()) errs.message = 'Message is required.'
    return errs
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setSubmitted(true)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <>
      <SEO
        title="Contact"
        description="Get in touch with Studio Zanetti to book a session, discuss a project, or ask a question. We'd love to hear from you."
      />

      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Contact</h1>
          <p className={styles.pageSubtitle}>Let's create something beautiful together</p>
        </header>

        <section className={styles.content}>
          <div className={styles.inner}>
            <div className={styles.details}>
              <h2 className={styles.detailsHeading}>Get in Touch</h2>
              <p className={styles.detailsIntro}>
                Ready to book a session or have a question? We'd love to hear from you.
                Fill in the form or reach us directly using the details below.
              </p>

              <address className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Email</span>
                  <a href="mailto:hello@studiozanetti.com" className={styles.contactValue}>
                    hello@studiozanetti.com
                  </a>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Phone</span>
                  <a href="tel:+390551234567" className={styles.contactValue}>
                    +39 055 123 4567
                  </a>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Studio</span>
                  <span className={styles.contactValue}>Via della Vigna Nuova 18, Florence, Italy</span>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Hours</span>
                  <span className={styles.contactValue}>Mon–Sat, 9:00am – 6:00pm</span>
                </div>
              </address>
            </div>

            <div className={styles.formWrapper}>
              {submitted ? (
                <div className={styles.success} role="alert">
                  <span className={styles.successIcon}>✓</span>
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We'll be in touch within 24 hours.</p>
                  <button className={styles.resetBtn} onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                  <div className={styles.field}>
                    <label htmlFor="name" className={styles.label}>Full Name</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                    {errors.name && <span className={styles.errorMsg} role="alert">{errors.name}</span>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="email" className={styles.label}>Email Address</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                    {errors.email && <span className={styles.errorMsg} role="alert">{errors.email}</span>}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="message" className={styles.label}>Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                      placeholder="Tell us about your project or enquiry…"
                      rows={6}
                    />
                    {errors.message && <span className={styles.errorMsg} role="alert">{errors.message}</span>}
                  </div>

                  <button type="submit" className={styles.submitBtn}>
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default Contact
