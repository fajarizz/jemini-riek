import {useEffect, useMemo, useRef} from 'react'
import {PromptBar} from '@/components/prompt-bar'
import {Bot, User} from 'lucide-react'
import {useChat} from '@/state/chat-store'
import './App.css'

function App() {
    const {activeMessages, sendMessage} = useChat()
    const { isSending } = useChat()

    const bottomRef = useRef<HTMLDivElement | null>(null)

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [activeMessages])

    const hasMessages = useMemo(() => activeMessages.length > 0, [activeMessages])

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-28">
            <div className="space-y-4">
                {hasMessages ? (
                    activeMessages.map((m) => (
                        <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                            <div className="flex max-w-[85%] items-start gap-3">
                                {m.role === 'assistant' && (
                                    <div
                                        className="size-8 shrink-0 rounded-full border bg-muted flex items-center justify-center">
                                        <Bot className="size-4"/>
                                    </div>
                                )}
                                <div
                                    className={m.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-2xl px-4 py-2 shadow-xs'
                                        : 'bg-muted rounded-2xl px-4 py-2 shadow-xs'}
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-6">{m.content}</p>
                                </div>
                                {m.role === 'user' && (
                                    <div
                                        className="size-8 shrink-0 rounded-full border bg-muted flex items-center justify-center">
                                        <User className="size-4"/>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-muted-foreground rounded-md border p-6 text-sm">
                        No messages yet. Start a new chat or pick one from the sidebar.
                    </div>
                )}
                <div ref={bottomRef}/>
            </div>

            <PromptBar onSubmit={sendMessage} disabled={isSending}/>
        </div>
    )
}

export default App






