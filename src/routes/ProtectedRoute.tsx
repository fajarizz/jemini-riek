import type {ReactNode} from 'react'
import {Navigate, useLocation} from 'react-router-dom'

export function ProtectedRoute({children}: {children: ReactNode}) {
    const location = useLocation()
    const authed = typeof window !== 'undefined' && !!localStorage.getItem('token')

    if (!authed) {
        return <Navigate to="/login" replace state={{from: location.pathname}} />
    }
    return <>{children}</>
}
