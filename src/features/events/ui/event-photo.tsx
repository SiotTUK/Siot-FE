import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { CloseIcon, ExpandIcon } from '@/shared/ui/icons'
import { isOnContainedImage } from '../contain-box'
import { eventLink } from '../event-display'
import { EventImage } from './event-image'
import styles from './event-photo.module.css'

/**
 * The detail screen's top photo; tapping it shows the whole picture. The open
 * viewer is its own history entry, so the phone's back button closes it and
 * stays on this screen.
 */
export function EventPhoto({
  url,
  title,
  lang,
  className,
}: {
  url?: string | null
  title: string
  lang: string
  className: string
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [loadedUrl, setLoadedUrl] = useState<string>()
  const src = eventLink(url ?? null)
  const loaded = src !== undefined && loadedUrl === src
  const open = location.state?.photoOpen === true

  const show = () =>
    void navigate(location, {
      // Keeps `from`, which the header's back button reads.
      state: { ...location.state, photoOpen: true },
      preventScrollReset: true,
    })

  return (
    <>
      {/* Until a photo loads this stays a decorative color block. */}
      <div className={className} aria-hidden={loaded ? undefined : true}>
        <EventImage url={url} onLoad={setLoadedUrl} />
        {loaded && (
          <button
            type="button"
            className={styles.open}
            aria-label={t('events.photo.open')}
            aria-haspopup="dialog"
            onClick={show}
          >
            <span className={styles.badge}>
              <ExpandIcon />
            </span>
          </button>
        )}
      </div>
      {open && src && (
        <PhotoViewer
          src={src}
          title={title}
          lang={lang}
          onClose={() => void navigate(-1)}
        />
      )}
    </>
  )
}

function PhotoViewer({
  src,
  title,
  lang,
  onClose,
}: {
  src: string
  title: string
  lang: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  const closing = useRef(false)

  // Layout effect: closing while still in the document returns focus to the
  // photo button.
  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  // Goes back only once; a second step would leave the detail screen.
  const close = () => {
    if (closing.current) return
    closing.current = true
    onClose()
  }

  const closeOnBackground = (event: MouseEvent<HTMLDialogElement>) => {
    const target = event.target
    if (target instanceof HTMLImageElement) {
      const box = target.getBoundingClientRect()
      const onPicture = isOnContainedImage(
        { x: event.clientX - box.left, y: event.clientY - box.top },
        box,
        { width: target.naturalWidth, height: target.naturalHeight },
      )
      if (onPicture) return
    } else if (target !== dialog.current) return
    close()
  }

  return (
    <dialog
      ref={dialog}
      className={styles.viewer}
      aria-label={t('events.photo.viewer')}
      onClick={closeOnBackground}
      // Escape, and the back gesture on browsers that send it to the dialog.
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      // The browser may close it without a cancelable `cancel`. The late event
      // from the effect cleanup finds the dialog open again or unmounted.
      onClose={() => {
        if (!dialog.current?.open) close()
      }}
    >
      <img className={styles.full} src={src} alt={title} lang={lang} />
      <button
        type="button"
        className={styles.close}
        aria-label={t('events.photo.close')}
        onClick={close}
      >
        <CloseIcon />
      </button>
    </dialog>
  )
}
