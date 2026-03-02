import { useEffect, useState } from 'react'

/**
 * Returns the current online status and updates reactively when it changes.
 * The initial value is read synchronously so there's no flash.
 */
const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState<boolean>(
    // typeof window guards against SSR — Node.js has navigator but not window
    typeof window !== 'undefined' ? (navigator.onLine ?? true) : true,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export default useOnlineStatus
