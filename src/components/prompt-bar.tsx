import * as React from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export interface PromptBarProps {
  className?: string
  placeholder?: string
  disabled?: boolean
  defaultValue?: string
  onSubmit?: (value: string) => void
}

export function PromptBar({
  className,
  placeholder = "Send a message...",
  disabled = false,
  defaultValue = "",
  onSubmit,
}: PromptBarProps) {
  const [value, setValue] = React.useState(defaultValue)
  const { state, isMobile } = useSidebar()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit?.(trimmed)
    setValue("")
  }

  // Compute left offset so the bar doesn’t overlay the sidebar on desktop
  const leftOffset: string | number = isMobile
    ? 0
    : state === "expanded"
    ? "var(--sidebar-width)"
    : 0

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-30 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      style={{ left: leftOffset }}
    >
      <div className="w-full p-3">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-12"
            aria-label="Prompt input"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <Button
              type="submit"
              size="icon"
              disabled={disabled || value.trim().length === 0}
              aria-label="Send message"
              title="Send"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
        <p className="text-muted-foreground/70 mt-2 px-1 text-xs">
          Press Enter to send
        </p>
      </div>
    </div>
  )
}

export default PromptBar
