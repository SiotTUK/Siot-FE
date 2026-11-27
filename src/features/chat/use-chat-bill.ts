import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { captureSessionScope } from '@/features/auth/session-scope'
import type { BillTranslation } from '@/features/bill-translation/api'
import type { validateBillFile } from '@/features/bill-translation/bill-translation'
import { useTranslateBill } from '@/features/bill-translation/use-bill-translations'
import { currentLanguage } from '@/shared/i18n'
import {
  addBillCard,
  billCards,
  dropNewBillCards,
  type ChatBillPosition,
} from './chat-bill-cards'
import { forgetConversation } from './chat-entry'

/** The upload on screen. It is not stored: only finished results are. */
export type ChatBillTurn = { conversationId: number | null } & (
  | { step: 'processing' }
  | { step: 'unreadable'; result: BillTranslation }
  | { step: 'error'; file: File; error: unknown }
)

type FileError = NonNullable<ReturnType<typeof validateBillFile>>

/**
 * #29 photo translation inside one chat screen: pick a JPG·PNG, agree, wait,
 * then keep the result as a card. Nothing is sent without consent for that
 * photo, and nothing is retried automatically.
 */
export function useChatBill(
  memberId: number,
  /** The conversation in the URL; null is the new chat. */
  conversationId: number | null,
  /** A question just started from a detail screen opens an empty new chat. */
  freshEntry: boolean,
) {
  useState(() => {
    if (freshEntry) dropNewBillCards(memberId)
  })
  const client = useQueryClient()
  const upload = useTranslateBill(memberId)
  const [file, setFile] = useState<File>()
  const [consent, setConsent] = useState(false)
  const [fileError, setFileError] = useState<FileError>()
  const [turn, setTurn] = useState<ChatBillTurn>()
  const active = useRef<AbortController | null>(null)

  // Leaving the conversation cancels its upload and drops what was pending.
  if (turn && turn.conversationId !== conversationId) setTurn(undefined)
  useEffect(
    () => () => {
      active.current?.abort()
      active.current = null
    },
    [conversationId],
  )

  function clear() {
    active.current?.abort()
    active.current = null
    upload.reset()
    setFile(undefined)
    setConsent(false)
    setFileError(undefined)
    setTurn(undefined)
  }

  /** Opens the consent sheet; also how a failed photo is sent again. */
  function select(selected: File) {
    setFileError(undefined)
    setConsent(false)
    setFile(selected)
  }

  async function start(afterMessageId: number | null) {
    if (!file || !consent || active.current) return
    const position: ChatBillPosition = { conversationId, afterMessageId }
    const controller = new AbortController()
    active.current = controller
    setFile(undefined)
    setTurn({ step: 'processing', conversationId })
    const isSessionCurrent = captureSessionScope(client, memberId)
    try {
      const result = await upload.start(
        { file, consent, language: currentLanguage() },
        controller.signal,
      )
      // A result for a session that already ended is never stored.
      if (controller.signal.aborted || !isSessionCurrent()) return
      upload.reset()
      if (result.readable && result.id !== null) {
        addBillCard(memberId, { translationId: result.id, ...position })
        // A plain "/chat" must now reopen this new chat, not an older one.
        if (conversationId === null) forgetConversation()
        setTurn(undefined)
      } else {
        setTurn({ step: 'unreadable', conversationId, result })
      }
    } catch (error) {
      if (!controller.signal.aborted)
        setTurn({ step: 'error', conversationId, file, error })
    } finally {
      if (active.current === controller) active.current = null
    }
  }

  return {
    cards: billCards(memberId, conversationId),
    turn,
    processing: turn?.step === 'processing',
    /** The picked photo waiting for consent. */
    file,
    consent,
    setConsent,
    fileError,
    reject: setFileError,
    select,
    closeConsent: () => setFile(undefined),
    start,
    /** Cancels the upload, or closes a failure card. */
    clear,
    /** A new question moves on from a failure card or a rejected file. */
    dismiss: () => {
      setFileError(undefined)
      setTurn((current) =>
        current?.step === 'processing' ? current : undefined,
      )
    },
    startOver: () => {
      clear()
      dropNewBillCards(memberId)
    },
  }
}
