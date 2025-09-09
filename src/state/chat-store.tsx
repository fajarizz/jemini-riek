import React from "react"

export type Role = "user" | "assistant"
export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
}
export interface Chat {
  id: string
  title: string
  createdAt: number
  messages: Message[]
}

interface ChatContextValue {
  chats: Chat[]
  activeChatId: string | null
  draft: boolean
  activeMessages: Message[]
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

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = React.useState<Chat[]>(() => loadChats())
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<boolean>(true)
  const [draftMessages, setDraftMessages] = React.useState<Message[]>([])

  React.useEffect(() => {
    saveChats(chats)
  }, [chats])

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
      const now = Date.now()
      const userMsg: Message = { id: uuid(), role: "user", content, createdAt: now }
      const assistantMsg: Message = {
        id: uuid(),
        role: "assistant",
        content: `Echo: ${content}`,
        createdAt: now + 1,
      }

      if (!activeChatId && draft) {
        // First message in a new draft -> create chat
        const title = content.length > 60 ? content.slice(0, 57) + "…" : content
        const id = uuid()
        const newChat: Chat = {
          id,
          title: title || "New chat",
          createdAt: now,
          messages: [userMsg, assistantMsg],
        }
        setChats((prev) => [newChat, ...prev])
        setActiveChatId(id)
        setDraft(false)
        setDraftMessages([])
        return
      }

      // Append to active chat
      if (activeChatId) {
        setChats((prev) =>
          prev.map((c) => (c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg, assistantMsg] } : c))
        )
      } else {
        // Safety: still in draft but activeChatId not set (shouldn't happen)
        setDraftMessages((prev) => [...prev, userMsg, assistantMsg])
      }
    },
    [activeChatId, draft]
  )

  const value = React.useMemo<ChatContextValue>(
    () => ({ chats, activeChatId, draft, activeMessages, newDraft, selectChat, sendMessage, setChats }),
    [chats, activeChatId, draft, activeMessages, newDraft, selectChat, sendMessage]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  const ctx = React.useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatProvider")
  return ctx
}

