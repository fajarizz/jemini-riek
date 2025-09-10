import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormEvent } from "react"
import { useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { signupRequest, storeAuth } from "@/lib/api"

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate()
    const location = useLocation()
    const from = (location.state as any)?.from || "/"

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        const email = String(formData.get("email") || "")
        const password = String(formData.get("password") || "")
        const confirm = String(formData.get("confirmPassword") || "")
        if (password !== confirm) {
            setError("Passwords do not match")
            return
        }
        if (!email || !password) return
        try {
            setLoading(true)
            const data = await signupRequest(email, password)
            storeAuth(data)
            navigate(from, { replace: true })
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Signup failed"
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                        Enter your email and password to sign up
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} noValidate>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    disabled={loading}
                                />
                            </div>
                            {error && (
                                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                                    {error}
                                </div>
                            )}
                            <div className="flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? "Signing up..." : "Sign Up"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    Sign up with Google
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="underline underline-offset-4"
                            >
                                Sign in
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
