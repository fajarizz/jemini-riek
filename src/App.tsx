import {useState} from 'react'
import {PromptBar} from '@/components/prompt-bar'
import './App.css'

function App() {
    const [lastPrompt, setLastPrompt] = useState<string>("")

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-28">
            <h1 className="mb-2 text-2xl font-semibold tracking-tight">AI Playground</h1>
            <p className="text-muted-foreground mb-8">Type a prompt below to get started.</p>
            {lastPrompt && (
                <div className="rounded-md border p-4 text-sm">
                    <span className="font-medium">You sent:</span> {lastPrompt}
                </div>
            )}

            <PromptBar onSubmit={setLastPrompt}/>
        </div>
    )
}

export default App
