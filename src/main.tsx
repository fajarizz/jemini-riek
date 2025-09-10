import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {ThemeProvider} from './components/theme-provider'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import {ChatShell} from '@/components/chat-shell'
import LoginPage from '@/pages/login/page'
import RegisterPage from '@/pages/register/page'
import {ProtectedRoute} from '@/routes/ProtectedRoute'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                <Routes>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path="/" element={<ProtectedRoute><ChatShell/></ProtectedRoute>}/>
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>,
)
