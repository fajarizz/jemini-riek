import axios from 'axios'

// Base URL comes from env or defaults to localhost.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Attach auth token automatically if present.
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export interface AuthResponse {
    session?: {
        access_token: string
    };
    user?: {
        id: string
        email: string
        name?: string
    }
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
    const {data} = await api.post<AuthResponse>('/auth/login', {email, password})
    return data
}

export async function signupRequest(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    const payload: any = { email, password }
    if (displayName) payload.displayName = displayName
    const {data} = await api.post<AuthResponse>('/auth/signup', payload)
    return data
}

export function storeAuth(data: AuthResponse) {
    const token = data?.session?.access_token
    if (token) {
        localStorage.setItem('token', token)
        localStorage.setItem('isAuthed', 'true')
    }
    if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
    }
}

export function clearAuth() {
    // Clear auth
    localStorage.removeItem('token')
    localStorage.removeItem('isAuthed')
    localStorage.removeItem('user')
    // Also clear any chat caches to avoid cross-account leakage
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (!key) continue
            if (key === 'chats_v1' || key.startsWith('chats_v1_')) {
                localStorage.removeItem(key)
            }
        }
    } catch {
        // ignore
    }
}

export interface ChatExchangeResponse {
    conversationId: string
    userMessageId: string
    assistantMessageId?: string
    assistantContent?: string
    modelUsed?: string
}

export async function createChat(prompt: string, title: string): Promise<ChatExchangeResponse> {
    const {data} = await api.post<ChatExchangeResponse>('/chat', {prompt, title})
    return data
}

export async function continueChat(conversationId: string, prompt: string): Promise<ChatExchangeResponse> {
    const {data} = await api.post<ChatExchangeResponse>('/chat', {conversationId, prompt})
    return data
}

// Conversation list for current user
export interface ConversationItemDto {
    id: string
    title: string
    is_group: boolean
    created_by: string
    created_at: string
}
export interface ConversationListResponse {
    conversations: ConversationItemDto[]
}

export async function fetchConversations(): Promise<ConversationItemDto[]> {
    const { data } = await api.get<ConversationListResponse>('/conversation')
    return data.conversations || []
}

// Profile me
export interface ProfileMeResponse {
    profile: {
        id: string
        displayName: string
        avatarUrl: string | null
        createdAt: string
    }
}

export async function fetchProfileMe(): Promise<ProfileMeResponse["profile"]> {
    const { data } = await api.get<ProfileMeResponse>('/profile/me')
    return data.profile
}