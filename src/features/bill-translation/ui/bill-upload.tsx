import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'
import {
  CameraIcon,
  ChevronDownIcon,
  FileTextIcon,
  ImageIcon,
  LightbulbIcon,
  LockIcon,
} from '@/shared/ui/icons'
import { MascotImage } from '@/shared/ui/mascot-image'
import { MascotTip } from '@/shared/ui/mascot-tip'
import { AttachmentItem } from '@/shared/ui/document'
import { PageBody } from '@/shared/ui/mobile-frame'
import { FormError, Muted, Card, Section, Stack } from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import { Sheet } from '@/shared/ui/sheet'
import type { BillTranslation } from '../api'
import {
  billErrorMessage,
  billTranslationPath,
  pdfType,
  photoTypes,
} from '../bill-translation'
import { useTranslateBill } from '../use-bill-translations'
import { BillConsent } from './bill-consent'
import {
  BillFailureCard,
  BillPhotoTips,
  BillRetakeActions,
} from './bill-failure'
import { BillFileInput } from './bill-file-input'
import { BillProcessingCard } from './bill-processing-card'
import { RecentBills } from './recent-bills'
import styles from './bill.module.css'

type UploadState =
  | { screen: 'select' }
  | { screen: 'consent' | 'processing'; file: File }
  | { screen: 'failure'; result: BillTranslation }

export function BillUpload({ memberId }: { memberId: number }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [state, setState] = useState<UploadState>({ screen: 'select' })
  const [choosing, setChoosing] = useState(false)
  const [consent, setConsent] = useState(false)
  const [fileError, setFileError] = useState<string>()
  const camera = useRef<HTMLInputElement>(null)
  const album = useRef<HTMLInputElement>(null)
  const pdf = useRef<HTMLInputElement>(null)
  const active = useRef<AbortController | null>(null)
  const upload = useTranslateBill(memberId)
  useEffect(() => () => active.current?.abort(), [])

  function reset() {
    active.current?.abort()
    active.current = null
    upload.reset()
    setState({ screen: 'select' })
    setConsent(false)
    setChoosing(false)
    setFileError(undefined)
  }

  function selectFile(file: File) {
    setFileError(undefined)
    upload.reset()
    setConsent(false)
    setState({ screen: 'consent', file })
  }

  async function start(file: File) {
    if (!consent || active.current) return
    const controller = new AbortController()
    active.current = controller
    setState({ screen: 'processing', file })
    try {
      const result = await upload.start(
        { file, consent, language: currentLanguage() },
        controller.signal,
      )
      if (controller.signal.aborted) return
      upload.reset()
      if (result.readable && result.id !== null) {
        void navigate(`${billTranslationPath}/${result.id}`)
      } else {
        setState({ screen: 'failure', result })
      }
    } catch {
      if (!controller.signal.aborted) setState({ screen: 'consent', file })
    } finally {
      if (active.current === controller) active.current = null
    }
  }

  return (
    <>
      <ScreenHeader
        title={t('bill.screenTitle')}
        back={
          state.screen === 'select'
            ? { label: t('common.back'), to: '/home' }
            : { label: t('common.back'), onClick: reset }
        }
      />
      <PageBody className={styles.body}>
        <BillFileInput
          ref={camera}
          accept={photoTypes}
          capture="environment"
          onSelect={selectFile}
          onReject={setFileError}
        />
        <BillFileInput
          ref={album}
          accept={photoTypes}
          onSelect={selectFile}
          onReject={setFileError}
        />
        <BillFileInput
          ref={pdf}
          accept={pdfType}
          onSelect={selectFile}
          onReject={setFileError}
        />
        <FormError
          message={fileError ? t(`bill.errors.${fileError}`) : undefined}
        />
        {state.screen === 'select' && (
          <>
            <section className={styles.hero}>
              <div className={styles.heroText}>
                <h2>{t('bill.uploadTitle')}</h2>
                <p>{t('bill.uploadIntro')}</p>
              </div>
              <MascotImage pose="hug" height={92} />
            </section>
            <button
              type="button"
              className={styles.cameraCard}
              onClick={() => camera.current?.click()}
            >
              <span className={styles.cameraIcon}>
                <CameraIcon />
              </span>
              <strong>{t('bill.camera')}</strong>
              <span>{t('bill.cameraHint')}</span>
            </button>
            <div className={styles.options}>
              <button type="button" onClick={() => album.current?.click()}>
                <ImageIcon />
                {t('bill.album')}
              </button>
              <button type="button" onClick={() => pdf.current?.click()}>
                <FileTextIcon />
                {t('bill.pdf')}
              </button>
            </div>
            <Muted>
              {t('bill.documentExamples')} {t('bill.formats')}
            </Muted>
            <details className={styles.privacyLine}>
              <summary>
                <LockIcon />
                <span>{t('bill.storageNotice')}</span>
                <ChevronDownIcon className={styles.chevron} />
              </summary>
              <p>
                <strong>{t('bill.privacyTitle')}</strong> {t('bill.privacy')}
              </p>
            </details>
            <details className={styles.tipsRow}>
              <summary>
                <span className={styles.tipsIcon}>
                  <LightbulbIcon />
                </span>
                <span>{t('bill.tipsTitle')}</span>
                <ChevronDownIcon className={styles.chevron} />
              </summary>
              <BillPhotoTips />
            </details>
            <RecentBills memberId={memberId} />
          </>
        )}
        {state.screen === 'consent' && (
          <Stack>
            <AttachmentItem name={state.file.name} />
            <BillConsent
              title={t('bill.consentTitle')}
              consent={consent}
              onConsentChange={setConsent}
              onAgree={() => void start(state.file)}
              error={
                upload.isError ? billErrorMessage(t, upload.error) : undefined
              }
            />
            <Button variant="text" onClick={reset}>
              {t('bill.changeFile')}
            </Button>
          </Stack>
        )}
        {state.screen === 'processing' && (
          <Processing
            key={state.file.name}
            file={state.file}
            onCancel={reset}
          />
        )}
        {state.screen === 'failure' && (
          <>
            <RecognitionFailure
              result={state.result}
              onRetry={() => setChoosing(true)}
              onAlbum={() => album.current?.click()}
              onRetake={() => camera.current?.click()}
            />
            {choosing && (
              <Sheet
                title={t('bill.pick')}
                closeLabel={t('common.cancel')}
                onClose={() => setChoosing(false)}
              >
                {(
                  [
                    { input: camera, label: 'camera' },
                    { input: album, label: 'album' },
                    { input: pdf, label: 'pdf' },
                  ] as const
                ).map(({ input, label }) => (
                  <Button
                    key={label}
                    variant="secondary"
                    block
                    onClick={() => {
                      setChoosing(false)
                      input.current?.click()
                    }}
                  >
                    {t(`bill.${label}`)}
                  </Button>
                ))}
              </Sheet>
            )}
          </>
        )}
      </PageBody>
    </>
  )
}

function Processing({ file, onCancel }: { file: File; onCancel: () => void }) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<string>()
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const frame = window.requestAnimationFrame(() => setPreview(url))
    return () => {
      window.cancelAnimationFrame(frame)
      URL.revokeObjectURL(url)
    }
  }, [file])
  return (
    <Stack gap={16}>
      <section className={styles.centerIntro}>
        <MascotImage pose="toroStand" height={140} />
        <h2>{t('bill.processingTitle')}</h2>
        <p>{t('bill.usualTime')}</p>
      </section>
      <BillProcessingCard />
      <AttachmentItem name={file.name}>
        {preview &&
          (file.type === pdfType ? (
            <object
              aria-label={t('bill.preview')}
              className={styles.preview}
              data={preview}
              type={pdfType}
            >
              <Muted>{t('bill.pdfNoPreview')}</Muted>
            </object>
          ) : (
            <img
              className={styles.preview}
              src={preview}
              alt={t('bill.preview')}
            />
          ))}
      </AttachmentItem>
      <MascotTip mascot="toro">{t('bill.storageNotice')}</MascotTip>
      <Button
        className={styles.secondary}
        variant="secondary"
        block
        onClick={onCancel}
      >
        {t('common.cancel')}
      </Button>
    </Stack>
  )
}

function RecognitionFailure({
  result,
  onRetry,
  onAlbum,
  onRetake,
}: {
  result: BillTranslation
  onRetry: () => void
  onAlbum: () => void
  onRetake: () => void
}) {
  const { t } = useTranslation()
  return (
    <Stack gap={16}>
      <section className={styles.centerIntro}>
        <MascotImage pose="haeroSit" height={130} />
        <h2>{t('bill.failed')}</h2>
      </section>
      <BillFailureCard result={result} onRetry={onRetry} />
      <Card>
        <strong className={styles.cardTitle}>{t('bill.tipsTitle')}</strong>
        <BillPhotoTips />
      </Card>
      <BillRetakeActions onAlbum={onAlbum} onRetake={onRetake} />
      <div className={styles.help}>
        <Link to="/chat">{t('bill.askDirect')}</Link>
        <Section title={t('bill.contact')}>
          <a href="tel:1345">{t('bill.immigration')} 1345</a>
          <a href="tel:0313103009">{t('bill.localOffice')} 031-310-3009</a>
        </Section>
      </div>
    </Stack>
  )
}
