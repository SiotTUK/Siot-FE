import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'
import { AttachmentItem } from '@/shared/ui/document'
import { CheckField } from '@/shared/ui/field'
import { PageBody } from '@/shared/ui/mobile-frame'
import {
  FormError,
  Muted,
  Notice,
  Card,
  Section,
  Stack,
} from '@/shared/ui/page'
import { ScreenHeader } from '@/shared/ui/screen-header'
import { Sheet } from '@/shared/ui/sheet'
import type { BillTranslation } from '../api'
import {
  billErrorMessage,
  billTranslationPath,
  pdfType,
  photoTypes,
  validateBillFile,
} from '../bill-translation'
import { useTranslateBill } from '../use-bill-translations'
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

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const { files, accept } = event.currentTarget
    const file = files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const error = validateBillFile(file, accept)
    if (error) {
      setFileError(error)
      return
    }
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
        <input
          hidden
          ref={camera}
          type="file"
          accept={photoTypes}
          capture="environment"
          onChange={selectFile}
        />
        <input
          hidden
          ref={album}
          type="file"
          accept={photoTypes}
          onChange={selectFile}
        />
        <input
          hidden
          ref={pdf}
          type="file"
          accept={pdfType}
          onChange={selectFile}
        />
        <FormError
          message={fileError ? t(`bill.errors.${fileError}`) : undefined}
        />
        {state.screen === 'select' && (
          <>
            <section className={styles.hero}>
              <h2>{t('bill.uploadTitle')}</h2>
              <p>{t('bill.uploadIntro')}</p>
            </section>
            <Muted>
              {t('bill.documentExamples')} {t('bill.formats')}
            </Muted>
            <Notice tone="note" title={t('bill.privacyTitle')}>
              {t('bill.privacy')}
            </Notice>
            <Stack gap={8}>
              <Button
                className={styles.primary}
                onClick={() => camera.current?.click()}
              >
                {t('bill.camera')}
              </Button>
              <Muted>{t('bill.cameraHint')}</Muted>
            </Stack>
            <div className={styles.actions}>
              <Button
                className={styles.secondary}
                variant="secondary"
                block
                onClick={() => album.current?.click()}
              >
                {t('bill.album')}
              </Button>
              <Button
                className={styles.primary}
                onClick={() => pdf.current?.click()}
              >
                {t('bill.pdf')}
              </Button>
            </div>
            <details className={styles.disclosure} open>
              <summary>{t('bill.tipsTitle')}</summary>
              <PhotoTips />
            </details>
            <RecentBills memberId={memberId} />
          </>
        )}
        {state.screen === 'consent' && (
          <Stack>
            <AttachmentItem name={state.file.name} />
            <Notice title={t('bill.consentTitle')}>{t('bill.privacy')}</Notice>
            <CheckField
              label={t('bill.agree')}
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            {upload.isError && (
              <FormError message={billErrorMessage(t, upload.error)} />
            )}
            <Button
              className={styles.primary}
              disabled={!consent}
              onClick={() => void start(state.file)}
            >
              {t('bill.translate')}
            </Button>
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

function PhotoTips() {
  const { t } = useTranslation()
  return (
    <ul className={styles.list}>
      <li>{t('bill.tipLight')}</li>
      <li>{t('bill.tipFrame')}</li>
      <li>{t('bill.tipFocus')}</li>
      <li>{t('bill.tipOnePage')}</li>
    </ul>
  )
}

function Processing({ file, onCancel }: { file: File; onCancel: () => void }) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<string>()
  const [delayed, setDelayed] = useState(false)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const timer = window.setTimeout(() => setDelayed(true), 10_000)
    const frame = window.requestAnimationFrame(() => setPreview(url))
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      URL.revokeObjectURL(url)
    }
  }, [file])
  return (
    <Stack gap={12}>
      <section className={styles.centerIntro}>
        <h2>{t('bill.processingTitle')}</h2>
        <Muted>{t('bill.usualTime')}</Muted>
      </section>
      <Card>
        <div className={styles.status} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <strong>{t('bill.processing')}</strong>
            <Muted>
              {t(delayed ? 'bill.delayed' : 'bill.processingDetails')}
            </Muted>
          </div>
        </div>
      </Card>
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
      <div className={styles.privacy}>
        <Notice tone="note" title={t('bill.privacyTitle')}>
          {t('bill.storageNotice')}
        </Notice>
      </div>
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
  const reason = result.retake?.reason
  return (
    <Stack gap={12}>
      <section className={styles.centerIntro}>
        <h2>{t('bill.failed')}</h2>
      </section>
      <Card>
        <strong className={styles.errorTitle}>{t('bill.recognition')}</strong>
        <p role="alert">
          {reason
            ? t(`bill.retake.${reason}`, {
                defaultValue: result.retake?.message,
              })
            : t('bill.tipFocus')}
        </p>
        <Button
          className={styles.secondary}
          variant="secondary"
          block
          onClick={onRetry}
        >
          {t('bill.retry')}
        </Button>
      </Card>
      <Card>
        <strong>{t('bill.tipsTitle')}</strong>
        <PhotoTips />
      </Card>
      <div className={styles.actions}>
        <Button
          className={styles.secondary}
          variant="secondary"
          block
          onClick={onAlbum}
        >
          {t('bill.album')}
        </Button>
        <Button className={styles.primary} onClick={onRetake}>
          {t('bill.captureAgain')}
        </Button>
      </div>
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
