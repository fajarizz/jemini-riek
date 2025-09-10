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
  token: string
  user?: {
    id: string
    email: string
    name?: string
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function signupRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/signup', { email, password })
  return data
}

export function storeAuth(data: AuthResponse) {
  localStorage.setItem('token', data.token)
  localStorage.setItem('isAuthed', 'true')
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user))
  }
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('isAuthed')
  localStorage.removeItem('user')
}

