import styles from './ShareButtons.module.scss'
import type { ShareButtonsProps } from './types'

const ShareButtons = ({ url, title }: ShareButtonsProps) => {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const links = [
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: 'Facebook',
    },
    {
      label: 'Share on X',
      href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: 'X',
    },
    {
      label: 'Share on Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      icon: 'Pinterest',
    },
    {
      label: 'Share via Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: 'Email',
    },
  ]

  return (
    <div className={styles.shareButtons} role="group" aria-label="Share this post">
      <span className={styles.label}>Share</span>
      {links.map((link) => (
        <a
          key={link.icon}
          href={link.href}
          className={styles.button}
          aria-label={link.label}
          target={link.icon === 'Email' ? undefined : '_blank'}
          rel={link.icon === 'Email' ? undefined : 'noopener noreferrer'}
        >
          {link.icon}
        </a>
      ))}
    </div>
  )
}

export default ShareButtons
