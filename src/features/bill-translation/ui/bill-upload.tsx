import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { currentLanguage } from '@/shared/i18n'
import { Button, ButtonLink } from '@/shared/ui/button'
import { AttachmentItem, DocumentStatus } from '@/shared/ui/document'
import { CheckField } from '@/shared/ui/field'
import { PageBody } from '@/shared/ui/mobile-frame'
import {
  FormError,
  Muted,
  Notice,
  PageHeading,
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
        title={t('bill.title')}
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
            <PageHeading
              title={t('bill.uploadTitle')}
              description={t('bill.formats')}
            />
            <Button onClick={() => setChoosing(true)}>{t('bill.pick')}</Button>
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
            <Section title={t('bill.tipsTitle')}>
              <PhotoTips />
            </Section>
            <Muted>{t('bill.privacy')}</Muted>
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
            <Button disabled={!consent} onClick={() => void start(state.file)}>
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
          <RecognitionFailure
            result={state.result}
            onRetake={() => camera.current?.click()}
          />
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
    <Stack>
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
      <DocumentStatus tone="loading" label={t('bill.processing')} />
      <ol className={styles.list} aria-label={t('bill.processing')}>
        <li>{t('bill.reading')}</li>
        <li>{t('bill.translating')}</li>
        <li>{t('bill.organizing')}</li>
      </ol>
      {delayed ? (
        <p role="status">{t('bill.delayed')}</p>
      ) : (
        <Muted>{t('bill.usualTime')}</Muted>
      )}
      <Button variant="secondary" block onClick={onCancel}>
        {t('common.cancel')}
      </Button>
    </Stack>
  )
}

function RecognitionFailure({
  result,
  onRetake,
}: {
  result: BillTranslation
  onRetake: () => void
}) {
  const { t } = useTranslation()
  const reason = result.retake?.reason
  return (
    <Stack>
      <DocumentStatus tone="error" label={t('bill.failed')}>
        <p role="alert">
          {reason
            ? t(`bill.retake.${reason}`, {
                defaultValue: result.retake?.message,
              })
            : t('bill.tipFocus')}
        </p>
      </DocumentStatus>
      <Section title={t('bill.tipsTitle')}>
        <PhotoTips />
      </Section>
      <Button onClick={onRetake}>{t('bill.captureAgain')}</Button>
      <ButtonLink variant="secondary" to="/chat">
        {t('bill.askDirect')}
      </ButtonLink>
      <Section title={t('bill.contact')}>
        <a href="tel:1345">{t('bill.immigration')} 1345</a>
        <a href="tel:0313103009">{t('bill.localOffice')} 031-310-3009</a>
      </Section>
    </Stack>
  )
}
