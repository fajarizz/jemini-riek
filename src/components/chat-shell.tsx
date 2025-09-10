import type {ReactNode} from 'react'
import App from '@/App'
import {SidebarProvider} from '@/components/ui/sidebar'
import {AppSidebar} from '@/components/app-sidebar'
import {ChatProvider} from '@/state/chat-store'

// ChatShell composes providers and layout for the main chat experience.
export function ChatShell({children}: {children?: ReactNode}) {
    return (
        <ChatProvider>
            <SidebarProvider>
                <AppSidebar/>
                {children ?? <App/>}
            </SidebarProvider>
        </ChatProvider>
    )
}

