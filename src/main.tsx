import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {ThemeProvider} from './components/theme-provider'
import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/app-sidebar.tsx";
import { ChatProvider } from "@/state/chat-store";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <ChatProvider>
                <SidebarProvider>
                    <AppSidebar/>
                    <App/>
                </SidebarProvider>
            </ChatProvider>
        </ThemeProvider>
    </StrictMode>,
)
