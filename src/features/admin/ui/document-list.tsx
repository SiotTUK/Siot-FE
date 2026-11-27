import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { currentLanguage } from '@/shared/i18n'
import { errorMessage } from '@/shared/i18n/error-message'
import { formatCalendarDate, formatDateTime } from '@/shared/i18n/format'
import { Button } from '@/shared/ui/button'
import { CheckField, TextAreaField, TextField } from '@/shared/ui/field'
import {
  Card,
  FormError,
  Muted,
  Notice,
  Stack,
  Tag,
  Toolbar,
} from '@/shared/ui/page'
import { InfiniteList, QueryState } from '@/shared/ui/query-state'
import {
  canRetry,
  documentFileType,
  isProcessing,
  validateDocumentFile,
  type DocumentResponse,
  type DocumentVersionResponse,
  type DocumentVersionSummary,
  type ProcessingStatus,
} from '../documents'
import {
  useAddDocumentVersion,
  useCreateDocument,
  useDocuments,
  useDocumentVersions,
  useReprocessDocument,
  useRefreshDocuments,
  useRetryDocumentVersion,
  useUpdateDocument,
} from '../use-documents'
import styles from './admin.module.css'

const statusTone: Record<ProcessingStatus, 'main' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  PROCESSING: 'warning',
  COMPLETED: 'main',
  FAILED: 'danger',
}

const urlPattern = /^https?:\/\/\S+$/

/** Picked file from a file input registered with React Hook Form. */
const fileField = z
  .custom<FileList | undefined>()
  .superRefine((files, context) => {
    const code = validateDocumentFile(files?.[0])
    if (code)
      context.addIssue({
        code: 'custom',
        message:
          code === 'DOCUMENT_FILE_REQUIRED'
            ? 'admin.documents.fileRequired'
            : `errors.${code}`,
      })
  })

/** ADM-02~04: chatbot source documents. Korean only (admin tool). */
export function DocumentList() {
  const { t } = useTranslation()
  const documents = useDocuments()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <Toolbar justify="end">
        <Button
          variant={creating ? 'secondary' : 'primary'}
          aria-expanded={creating}
          onClick={() => setCreating((value) => !value)}
        >
          {t(
            creating ? 'admin.documents.closeCreate' : 'admin.documents.create',
          )}
        </Button>
      </Toolbar>
      {creating && <DocumentCreateForm onCreated={() => setCreating(false)} />}
      <InfiniteList
        query={documents}
        empty={t('admin.empty')}
        getKey={(document) => document.documentId}
        renderItem={(document) => <DocumentCard document={document} />}
      />
    </>
  )
}

const createSchema = z.object({
  file: fileField,
  name: z
    .string()
    .trim()
    .min(1, 'admin.documents.nameRequired')
    .max(255, 'admin.tooLong'),
  sourceUrl: z
    .string()
    .trim()
    .max(2000, 'admin.tooLong')
    .regex(urlPattern, 'admin.documents.urlInvalid'),
  publishedOn: z.string(),
  excludedPages: z.string().max(1000, 'admin.tooLong'),
})
type CreateValues = z.input<typeof createSchema>

function DocumentCreateForm({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation()
  const create = useCreateDocument()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      sourceUrl: '',
      publishedOn: '',
      excludedPages: '',
    },
  })
  const onSubmit = handleSubmit((values) =>
    create.mutate(
      {
        file: (values.file as FileList)[0],
        name: values.name.trim(),
        sourceUrl: values.sourceUrl.trim(),
        publishedOn: values.publishedOn || undefined,
        excludedPages: values.excludedPages.trim() || undefined,
      },
      { onSuccess: onCreated },
    ),
  )
  const message = (key?: string) => (key ? t(key) : undefined)

  return (
    <Card>
      <form onSubmit={(event) => void onSubmit(event)}>
        <Stack gap={12}>
          <TextField
            {...register('file')}
            type="file"
            accept={`${documentFileType},.pdf`}
            label={t('admin.documents.file')}
            error={message(errors.file?.message)}
          />
          <TextField
            {...register('name')}
            label={t('admin.documents.name')}
            maxLength={255}
            error={message(errors.name?.message)}
          />
          <TextField
            {...register('sourceUrl')}
            type="url"
            label={t('admin.documents.sourceUrl')}
            maxLength={2000}
            error={message(errors.sourceUrl?.message)}
          />
          <TextField
            {...register('publishedOn')}
            type="date"
            label={t('admin.documents.publishedOn')}
          />
          <TextField
            {...register('excludedPages')}
            label={t('admin.documents.excludedPages')}
            help={t('admin.documents.excludedPagesHelp')}
            error={message(errors.excludedPages?.message)}
          />
          <Button type="submit" loading={create.isPending}>
            {t('admin.documents.submitCreate')}
          </Button>
          {create.isError && (
            <FormError message={errorMessage(t, create.error)} />
          )}
        </Stack>
      </form>
    </Card>
  )
}

function StatusTag({ status }: { status: ProcessingStatus }) {
  const { t } = useTranslation()
  return (
    <Tag tone={statusTone[status]}>{t(`admin.documents.status.${status}`)}</Tag>
  )
}

function DocumentCard({ document }: { document: DocumentResponse }) {
  const { t } = useTranslation()
  const language = currentLanguage()
  const [open, setOpen] = useState(false)
  const { currentVersion: current, latestVersion: latest } = document

  return (
    <Card>
      <Toolbar justify="between">
        <strong>{document.name}</strong>
        <Tag tone={document.active ? 'main' : undefined}>
          {t(
            document.active
              ? 'admin.documents.active'
              : 'admin.documents.inactive',
          )}
        </Tag>
      </Toolbar>
      <Muted>
        {current
          ? t('admin.documents.current', { no: current.versionNo })
          : t('admin.documents.noCurrent')}
        {latest && latest.versionId !== current?.versionId && (
          <>
            {' · '}
            {t('admin.documents.latest', {
              no: latest.versionNo,
              status: t(`admin.documents.status.${latest.status}`),
            })}
          </>
        )}
        {document.publishedOn && (
          <>
            {' · '}
            {t('admin.documents.published', {
              date: formatCalendarDate(document.publishedOn, language),
            })}
          </>
        )}
      </Muted>
      <Toolbar justify="between">
        {latest ? <StatusTag status={latest.status} /> : <span />}
        <Toolbar>
          {document.sourceUrl && (
            <a
              className={styles.link}
              href={document.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('admin.documents.openSource')} ↗
            </a>
          )}
          <Button
            variant="secondary"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {t(open ? 'admin.documents.closeManage' : 'admin.documents.manage')}
          </Button>
        </Toolbar>
      </Toolbar>
      {open && <DocumentPanel document={document} />}
    </Card>
  )
}

function DocumentPanel({ document }: { document: DocumentResponse }) {
  return (
    <Stack gap={16}>
      <DocumentInfoForm document={document} />
      <VersionList document={document} />
      <VersionUploadForm document={document} />
      <ReprocessForm document={document} />
    </Stack>
  )
}

const infoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'admin.documents.nameRequired')
    .max(255, 'admin.tooLong'),
  sourceUrl: z
    .string()
    .trim()
    .max(2000, 'admin.tooLong')
    .regex(urlPattern, 'admin.documents.urlInvalid'),
  publishedOn: z.string(),
  active: z.boolean(),
})
type InfoValues = z.input<typeof infoSchema>

function DocumentInfoForm({ document }: { document: DocumentResponse }) {
  const { t } = useTranslation()
  const update = useUpdateDocument(document.documentId)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: document.name,
      sourceUrl: document.sourceUrl ?? '',
      publishedOn: document.publishedOn ?? '',
      active: document.active,
    },
  })
  // PATCH changes only what is sent; a blank date is not sent (no clearing).
  const onSubmit = handleSubmit((values) =>
    update.mutate({
      name: values.name.trim(),
      sourceUrl: values.sourceUrl.trim(),
      publishedOn: values.publishedOn || undefined,
      active: values.active,
    }),
  )
  const message = (key?: string) => (key ? t(key) : undefined)

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <Stack gap={12}>
        <strong>{t('admin.documents.info')}</strong>
        <TextField
          {...register('name')}
          label={t('admin.documents.name')}
          maxLength={255}
          error={message(errors.name?.message)}
        />
        <TextField
          {...register('sourceUrl')}
          type="url"
          label={t('admin.documents.sourceUrl')}
          maxLength={2000}
          error={message(errors.sourceUrl?.message)}
        />
        <TextField
          {...register('publishedOn')}
          type="date"
          label={t('admin.documents.publishedOn')}
        />
        <CheckField
          {...register('active')}
          label={t('admin.documents.activeField')}
        />
        <Button type="submit" variant="secondary" loading={update.isPending}>
          {t(update.isSuccess ? 'admin.saved' : 'admin.documents.saveInfo')}
        </Button>
        {update.isError && (
          <FormError message={errorMessage(t, update.error)} />
        )}
      </Stack>
    </form>
  )
}

function VersionList({ document }: { document: DocumentResponse }) {
  const { t } = useTranslation()
  const versions = useDocumentVersions(document.documentId)
  const retry = useRetryDocumentVersion(document.documentId)
  const processing = versions.data?.some((version) =>
    isProcessing(version.status),
  )
  // The card shows the list's current/latest version; when the versions
  // here are newer (indexing moved on), the list catches up.
  const refreshList = useRefreshDocuments()
  const latest = versions.data?.[0]
  const stale =
    latest !== undefined &&
    (latest.versionId !== document.latestVersion?.versionId ||
      latest.status !== document.latestVersion.status)
  useEffect(() => {
    if (stale) void refreshList()
  }, [stale, latest?.versionId, latest?.status, refreshList])

  return (
    <Stack gap={8}>
      <strong>{t('admin.documents.versions')}</strong>
      {processing && <Muted>{t('admin.documents.refreshing')}</Muted>}
      <QueryState query={versions}>
        <Stack as="ul" gap={8}>
          {versions.data?.map((version) => (
            <li key={version.versionId}>
              <VersionRow
                version={version}
                current={document.currentVersion}
                retrying={
                  retry.isPending && retry.variables === version.versionId
                }
                onRetry={() => retry.mutate(version.versionId)}
              />
            </li>
          ))}
        </Stack>
      </QueryState>
      {retry.isError && <FormError message={errorMessage(t, retry.error)} />}
    </Stack>
  )
}

function VersionRow({
  version,
  current,
  retrying,
  onRetry,
}: {
  version: DocumentVersionResponse
  current: DocumentVersionSummary | null
  retrying: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const language = currentLanguage()
  return (
    <div className={styles.version}>
      <Toolbar justify="between">
        <span>
          <strong>
            {t('admin.documents.versionNo', { no: version.versionNo })}
          </strong>
          {version.changeType && (
            <> · {t(`admin.documents.changeType.${version.changeType}`)}</>
          )}
        </span>
        <Toolbar>
          {version.current && (
            <Tag tone="main">{t('admin.documents.currentBadge')}</Tag>
          )}
          <StatusTag status={version.status} />
        </Toolbar>
      </Toolbar>
      {version.originalFilename && <Muted>{version.originalFilename}</Muted>}
      {version.changeSummary && <p>{version.changeSummary}</p>}
      <Muted>
        {t('admin.documents.uploadedAt', {
          date: formatDateTime(version.uploadedAt, language),
        })}
        {version.processedAt && (
          <>
            {' · '}
            {t('admin.documents.processedAt', {
              date: formatDateTime(version.processedAt, language),
            })}
          </>
        )}
        {version.status === 'COMPLETED' && (
          <> · {t('admin.documents.chunks', { count: version.chunkCount })}</>
        )}
        {version.excludedPages && (
          <>
            {' '}
            · {t('admin.documents.excluded', { pages: version.excludedPages })}
          </>
        )}
      </Muted>
      {version.status === 'FAILED' && (
        <p className={styles.failure} role="note">
          {t('admin.documents.failed', {
            stage: version.failedStage
              ? t(`admin.documents.stage.${version.failedStage}`)
              : '—',
            reason: version.failureReason ?? '—',
          })}
        </p>
      )}
      {canRetry(version, current) && (
        <Button variant="secondary" loading={retrying} onClick={onRetry}>
          {t('admin.documents.retry')}
        </Button>
      )}
    </div>
  )
}

const uploadSchema = z.object({
  file: fileField,
  changeSummary: z.string().max(1000, 'admin.tooLong'),
  excludedPages: z.string().max(1000, 'admin.tooLong'),
})
type UploadValues = z.input<typeof uploadSchema>

function VersionUploadForm({ document }: { document: DocumentResponse }) {
  const { t } = useTranslation()
  const upload = useAddDocumentVersion(document.documentId)
  // The BE requires excludedPages when the current version leaves pages out.
  const currentPages = document.currentVersion?.excludedPages ?? null
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { changeSummary: '', excludedPages: currentPages ?? '' },
  })
  const onSubmit = handleSubmit((values, event) => {
    const formElement = event?.target as HTMLFormElement | undefined
    upload.mutate(
      {
        file: (values.file as FileList)[0],
        changeSummary: values.changeSummary.trim() || undefined,
        // Sent (even blank) when required, so "keep every page" is explicit.
        excludedPages:
          currentPages !== null
            ? values.excludedPages.trim()
            : values.excludedPages.trim() || undefined,
      },
      {
        onSuccess: () => {
          // The native reset clears the picked file, which RHF cannot set.
          formElement?.reset()
          reset({ changeSummary: '', excludedPages: currentPages ?? '' })
        },
      },
    )
  })
  const message = (key?: string) => (key ? t(key) : undefined)

  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <Stack gap={12}>
        <strong>{t('admin.documents.upload')}</strong>
        <TextField
          {...register('file')}
          type="file"
          accept={`${documentFileType},.pdf`}
          label={t('admin.documents.file')}
          error={message(errors.file?.message)}
        />
        <TextAreaField
          {...register('changeSummary')}
          label={t('admin.documents.changeSummary')}
          rows={2}
          maxLength={1000}
          error={message(errors.changeSummary?.message)}
        />
        <TextField
          {...register('excludedPages')}
          label={t('admin.documents.excludedPages')}
          help={
            currentPages
              ? t('admin.documents.excludedPagesRequired', {
                  pages: currentPages,
                })
              : t('admin.documents.excludedPagesHelp')
          }
          error={message(errors.excludedPages?.message)}
        />
        <Button type="submit" variant="secondary" loading={upload.isPending}>
          {t('admin.documents.submitUpload')}
        </Button>
        {upload.isSuccess && (
          <Notice tone="success">{t('admin.documents.uploaded')}</Notice>
        )}
        {upload.isError && (
          <FormError message={errorMessage(t, upload.error)} />
        )}
      </Stack>
    </form>
  )
}

function ReprocessForm({ document }: { document: DocumentResponse }) {
  const { t } = useTranslation()
  const reprocess = useReprocessDocument(document.documentId)
  const currentPages = document.currentVersion?.excludedPages ?? ''
  const [pages, setPages] = useState(currentPages)
  if (!document.currentVersion) return null

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        // Unchanged → omit (BE keeps the current value); '' keeps every page.
        reprocess.mutate(
          pages.trim() === currentPages ? undefined : pages.trim(),
        )
      }}
    >
      <Stack gap={12}>
        <strong>{t('admin.documents.reprocess')}</strong>
        <Muted>{t('admin.documents.reprocessHelp')}</Muted>
        <TextField
          label={t('admin.documents.reprocessPages')}
          value={pages}
          maxLength={1000}
          onChange={(event) => setPages(event.target.value)}
        />
        <Button type="submit" variant="secondary" loading={reprocess.isPending}>
          {t('admin.documents.submitReprocess')}
        </Button>
        {reprocess.isSuccess && (
          <Notice tone="success">{t('admin.documents.reprocessed')}</Notice>
        )}
        {reprocess.isError && (
          <FormError message={errorMessage(t, reprocess.error)} />
        )}
      </Stack>
    </form>
  )
}
