import {Search, Plus, User} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {useChat} from "@/state/chat-store"
import * as React from "react"
import {Card, CardContent} from "@/components/ui/card"
import {clearAuth, fetchProfileMe} from "@/lib/api"
import {useNavigate} from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"

export function AppSidebar() {
    const {chats, activeChatId, draft, selectChat, newDraft, isConversationsLoading} = useChat()
    const [query, setQuery] = React.useState("")
    const navigate = useNavigate()

    const [profileName, setProfileName] = React.useState<string>("Your Name")
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)

    React.useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) return
        let cancelled = false
        ;(async () => {
            try {
                const p = await fetchProfileMe()
                if (cancelled) return
                setProfileName(p.displayName || "Your Name")
                setAvatarUrl(p.avatarUrl)
            } catch {
                // ignore profile errors
            }
        })()
        return () => { cancelled = true }
    }, [])

    function handleLogout() {
        clearAuth()
        navigate('/login', {replace: true})
    }

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return chats
        return chats.filter((c) => c.title.toLowerCase().includes(q))
    }, [chats, query])

    return (
        <Sidebar>
            <SidebarContent>
                <div className="flex h-full flex-col">
                    {/* Top: Trigger + New Chat + Search */}
                    <SidebarGroup>
                        <div
                            className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-sidebar-foreground/70">
                            <SidebarTrigger/>
                            <span>Chats</span>
                        </div>
                        <SidebarGroupContent>
                            <div className="flex items-center gap-2 p-2">
                                <Button className="w-full" onClick={() => newDraft()}>
                                    <Plus className="mr-2 size-4"/> New chat
                                </Button>
                            </div>
                            <div className="p-2 pt-0">
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search chats"
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Middle: Chat list */}
                    <SidebarGroup className="flex-1 overflow-auto">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {isConversationsLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <SidebarMenuItem key={`sk-${i}`}>
                                            <Skeleton className="h-8 w-full" />
                                        </SidebarMenuItem>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <div className="text-muted-foreground px-4 py-6 text-sm">No chats yet.</div>
                                ) : (
                                    filtered.map((chat) => {
                                        const active = !draft && activeChatId === chat.id
                                        return (
                                            <SidebarMenuItem key={chat.id}>
                                                <Button
                                                    onClick={() => selectChat(chat.id)}
                                                    variant={active ? "secondary" : "tertiary"}
                                                    size="sm"
                                                    className="w-full justify-start text-left"
                                                >
                                                    <span className="truncate">{chat.title}</span>
                                                </Button>
                                            </SidebarMenuItem>
                                        )
                                    })
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Bottom: Profile */}
                    <SidebarGroup className="mt-auto">
                        <SidebarGroupContent>
                            <Card className="m-2">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3 mb-3">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={profileName} className="size-8 rounded-full border object-cover" />
                                        ) : (
                                            <div className="size-8 rounded-full border bg-muted text-foreground/80 flex items-center justify-center">
                                                <User className="size-4"/>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex flex-col items-start justify-start">
                                            <div className="truncate text-sm font-medium">{profileName}</div>
                                        </div>
                                    </div>
                                    <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
                                        Logout
                                    </Button>
                                </CardContent>
                            </Card>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </div>
            </SidebarContent>
        </Sidebar>
    )
}