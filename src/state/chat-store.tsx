import React from "react"
import {createChat, continueChat, fetchConversations, type ConversationItemDto} from "@/lib/api"

export type Role = "user" | "assistant"

export interface Message {
    id: string
    role: Role
    content: string
    createdAt: number
}

export interface Chat {
    id: string // backend conversationId
    title: string
    createdAt: number
    messages: Message[]
}

interface ChatContextValue {
    chats: Chat[]
    activeChatId: string | null
    draft: boolean
    activeMessages: Message[]
    isSending: boolean
    isConversationsLoading: boolean
    newDraft: () => void
    selectChat: (id: string) => void
    sendMessage: (content: string) => void
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>
}

const ChatContext = React.createContext<ChatContextValue | null>(null)

const STORAGE_KEY = "chats_v1"

function loadChats(): Chat[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as Chat[]
        // Basic validation
        if (!Array.isArray(parsed)) return []
        return parsed
    } catch {
        return []
    }
}

function saveChats(chats: Chat[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    } catch {
        // ignore
    }
}

function uuid() {
    // Prefer crypto if available
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
    return Math.random().toString(36).slice(2)
}

export function ChatProvider({children}: { children: React.ReactNode }) {
    const [chats, setChats] = React.useState<Chat[]>(() => loadChats())
    const [activeChatId, setActiveChatId] = React.useState<string | null>(null)
    const [draft, setDraft] = React.useState<boolean>(true)
    const [draftMessages, setDraftMessages] = React.useState<Message[]>([])
    const [isSending, setIsSending] = React.useState(false)
    const [isConversationsLoading, setIsConversationsLoading] = React.useState(false)

    React.useEffect(() => {
        saveChats(chats)
    }, [chats])

    // Initial load of conversations from backend (if authed)
    React.useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) return

        let cancelled = false
        setIsConversationsLoading(true)
        ;(async () => {
            try {
                const list = await fetchConversations()
                if (cancelled) return

                setChats((prev) => {
                    const prevMap = new Map(prev.map((c) => [c.id, c]))

                    const fromServer: Chat[] = list.map((conv: ConversationItemDto) => {
                        const existing = prevMap.get(conv.id)
                        const createdAt = new Date(conv.created_at).getTime()
                        if (existing) {
                            return {
                                ...existing,
                                setChats: undefined,
                            }
                        }
                        return {
                            id: conv.id,
                            title: conv.title || 'Untitled',
                            createdAt,
                            messages: [],
                        }
                    })

                    // Include any local-only chats not on server (e.g., offline)
                    const serverIds = new Set(list.map((c) => c.id))
                    const localOnly = prev.filter((c) => !serverIds.has(c.id))

                    // Keep server order first, then local-only
                    return [...fromServer, ...localOnly]
                })
            } catch (e) {
                // Silently ignore; sidebar will just show local state
            } finally {
                if (!cancelled) setIsConversationsLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const activeMessages = React.useMemo(() => {
        if (activeChatId) {
            const chat = chats.find((c) => c.id === activeChatId)
            return chat?.messages ?? []
        }
        return draftMessages
    }, [activeChatId, chats, draftMessages])

    const newDraft = React.useCallback(() => {
        setActiveChatId(null)
        setDraft(true)
        setDraftMessages([])
    }, [])

    const selectChat = React.useCallback((id: string) => {
        setActiveChatId(id)
        setDraft(false)
    }, [])

    const sendMessage = React.useCallback(
        (content: string) => {
            if (isSending) return
            const prompt = content.trim()
            if (!prompt) return

            const now = Date.now()
            const optimisticUser: Message = {id: uuid(), role: "user", content: prompt, createdAt: now}
            const thinking: Message = {id: uuid(), role: "assistant", content: "Thinking...", createdAt: now + 1}

            // Draft (no conversation yet) -> create chat
            if (!activeChatId && draft) {
                setIsSending(true)
                // Optimistically show user message and thinking placeholder in draft area
                setDraftMessages([optimisticUser, thinking])
                ;(async () => {
                    try {
                        const title = prompt.length > 60 ? prompt.slice(0, 57) + "…" : prompt || "New chat"
                        const resp = await createChat(prompt, title)
                        const conversationId = resp.conversationId
                        const userMsg: Message = {
                            id: resp.userMessageId || optimisticUser.id,
                            role: "user",
                            content: prompt,
                            createdAt: now
                        }
                        const assistantMsg: Message | null = resp.assistantContent
                            ? {
                                id: resp.assistantMessageId || uuid(),
                                role: "assistant",
                                content: resp.assistantContent,
                                createdAt: Date.now()
                            }
                            : null
                        const newChat: Chat = {
                            id: conversationId,
                            title,
                            createdAt: now,
                            messages: assistantMsg ? [userMsg, assistantMsg] : [userMsg],
                        }
                        setChats((prev) => [newChat, ...prev.filter((c) => c.id !== conversationId)])
                        setActiveChatId(conversationId)
                        setDraft(false)
                        setDraftMessages([])
                    } catch (e: any) {
                        const errMsg: Message = {
                            id: uuid(),
                            role: "assistant",
                            content: "Error creating chat: " + (e?.response?.data?.message || e.message || "Unknown error"),
                            createdAt: Date.now(),
                        }
                        // Replace thinking with error
                        setDraftMessages([optimisticUser, errMsg])
                    } finally {
                        setIsSending(false)
                    }
                })()
                return
            }

            // Continuing existing conversation
            if (activeChatId) {
                setIsSending(true)
                // Optimistically append user message and thinking placeholder
                setChats((prev) =>
                    prev.map((c) =>
                        c.id === activeChatId ? {...c, messages: [...c.messages, optimisticUser, thinking]} : c
                    )
                )
                ;(async () => {
                    try {
                        const resp = await continueChat(activeChatId, prompt)
                        const userMsg: Message = {
                            id: resp.userMessageId || optimisticUser.id,
                            role: "user",
                            content: prompt,
                            createdAt: now
                        }
                        const assistantMsg: Message | null = resp.assistantContent
                            ? {
                                id: resp.assistantMessageId || uuid(),
                                role: "assistant",
                                content: resp.assistantContent,
                                createdAt: Date.now()
                            }
                            : null
                        setChats((prev) =>
                            prev.map((c) =>
                                c.id === activeChatId
                                    ? {
                                        ...c,
                                        messages: assistantMsg
                                            ? // Replace the last two (optimistic user + thinking) with final user + assistant
                                            [...c.messages.slice(0, -2), userMsg, assistantMsg]
                                            : // No assistant content returned, keep final user, drop thinking
                                            [...c.messages.slice(0, -2), userMsg],
                                    }
                                    : c
                            )
                        )
                    } catch (e: any) {
                        const errMsg: Message = {
                            id: uuid(),
                            role: "assistant",
                            content: "Error sending message: " + (e?.response?.data?.message || e.message || "Unknown error"),
                            createdAt: Date.now(),
                        }
                        setChats((prev) =>
                            prev.map((c) =>
                                c.id === activeChatId
                                    ? {...c, messages: [...c.messages.slice(0, -1), errMsg]} // replace thinking with error
                                    : c
                            )
                        )
                    } finally {
                        setIsSending(false)
                    }
                })()
                return
            }

            // Fallback (shouldn't happen)
            setDraftMessages((prev) => [...prev, optimisticUser])
        },
        [activeChatId, draft, isSending]
    )

    const value = React.useMemo<ChatContextValue>(
        () => ({
            chats,
            activeChatId,
            draft,
            activeMessages,
            isSending,
            isConversationsLoading,
            newDraft,
            selectChat,
            sendMessage,
            setChats
        }),
        [chats, activeChatId, draft, activeMessages, isSending, isConversationsLoading, newDraft, selectChat, sendMessage]
    )

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
    const ctx = React.useContext(ChatContext)
    if (!ctx) throw new Error("useChat must be used within ChatProvider")
    return ctx
}