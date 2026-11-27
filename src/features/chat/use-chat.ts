import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Language } from '@/shared/api/types'
import {
  askQuestion,
  chatKeys,
  createConversation,
  deleteConversation,
  fetchConversations,
  fetchMessages,
  fetchSuggestions,
  sendFeedback,
  type MessageResponse,
} from './api'
import { forgetConversation } from './chat-entry'

export function useSuggestions(language: Language) {
  return useQuery({
    queryKey: chatKeys.suggestions(language),
    queryFn: () => fetchSuggestions(language),
    staleTime: 5 * 60_000,
  })
}

export function useConversations() {
  return useInfiniteQuery({
    queryKey: chatKeys.conversations(),
    queryFn: ({ pageParam }) => fetchConversations(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}

export function useMessages(conversationId: number | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? 0),
    queryFn: () => fetchMessages(conversationId ?? 0),
    enabled: conversationId !== undefined,
  })
}

/**
 * Sends a question. A conversation is created only with the first question,
 * so opening the chat never leaves empty conversations behind.
 * `onConversation` fires as soon as one exists, even if the answer then fails.
 */
export function useAsk(onConversation: (conversationId: number) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      conversationId?: number
      content: string
      language: Language
    }) => {
      let conversationId = input.conversationId
      if (conversationId === undefined) {
        conversationId = (await createConversation(input.language))
          .conversationId
        onConversation(conversationId)
      }
      const result = await askQuestion(conversationId, input.content)
      return { conversationId, result }
    },
    onSuccess: ({ conversationId, result }) => {
      const question = { ...result.question, masked: result.masked }
      queryClient.setQueryData<MessageResponse[]>(
        chatKeys.messages(conversationId),
        (current = []) => [
          ...current.filter(
            (message) =>
              message.messageId !== question.messageId &&
              message.messageId !== result.answer.messageId,
          ),
          question,
          result.answer,
        ],
      )
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, conversationId) => {
      forgetConversation(conversationId)
      queryClient.removeQueries({ queryKey: chatKeys.messages(conversationId) })
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      })
    },
  })
}

/** CB-04. Re-sending overwrites; the cache shows the choice right away. */
export function useFeedback(conversationId: number) {
  const queryClient = useQueryClient()
  const key = chatKeys.messages(conversationId)
  const setHelpful = (messageId: number, helpful: boolean | null) =>
    queryClient.setQueryData<MessageResponse[]>(key, (current) =>
      current?.map((message) =>
        message.messageId === messageId ? { ...message, helpful } : message,
      ),
    )
  return useMutation({
    mutationFn: (input: { messageId: number; helpful: boolean }) =>
      sendFeedback(conversationId, input.messageId, input.helpful),
    onMutate: ({ messageId, helpful }) => {
      const previous = queryClient
        .getQueryData<MessageResponse[]>(key)
        ?.find((message) => message.messageId === messageId)?.helpful
      setHelpful(messageId, helpful)
      return { previous: previous ?? null }
    },
    onError: (_, { messageId }, context) =>
      setHelpful(messageId, context?.previous ?? null),
  })
}
