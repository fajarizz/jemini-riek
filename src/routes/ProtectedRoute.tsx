import type {ReactNode} from 'react'
import {Navigate, useLocation} from 'react-router-dom'

export function ProtectedRoute({children}: {children: ReactNode}) {
    const authed = typeof window !== 'undefined' && localStorage.getItem('isAuthed') === 'true'
    const location = useLocation()

    if (!authed) {
        return <Navigate to="/login" replace state={{from: location.pathname}} />
    }
    return <>{children}</>
}

