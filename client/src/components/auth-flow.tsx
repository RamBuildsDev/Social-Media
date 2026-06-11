"use client"

import type React from "react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2, Check, Eye, EyeOff, Bird } from "lucide-react"
import { API_URL } from "@/lib/config"

export function AuthFlow() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login"
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab)
  const [view, setView] = useState<"main" | "forgot">("main")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [resetOtp, setResetOtp] = useState("")
  const [newPass, setNewPass] = useState("")
  const [resetStep, setResetStep] = useState(1)

  const { login, sendOtp, register } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setIsLoading(true)
    try { await login(loginUsername, loginPassword) }
    catch (err) { setError(err instanceof Error ? err.message : "Login failed") }
    finally { setIsLoading(false) }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setIsLoading(true)
    try { await sendOtp(email, username); setStep(2) }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to send OTP") }
    finally { setIsLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setIsLoading(true)
    try { await register(email, username, password, fullName, otp) }
    catch (err) { setError(err instanceof Error ? err.message : "Registration failed") }
    finally { setIsLoading(false) }
  }

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      })
      if (!res.ok) throw new Error("Failed")
      setResetStep(2)
    } catch { setError("User not found or error sending email") }
    finally { setIsLoading(false) }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, new_password: newPass })
      })
      if (!res.ok) throw new Error("Invalid OTP")
      setView("main"); setResetStep(1); setResetEmail(""); setResetOtp(""); setNewPass("")
    } catch { setError("Failed to reset password") }
    finally { setIsLoading(false) }
  }

  const isLengthValid = password.length >= 8
  const hasNumber = /\d/.test(password)
  const isPasswordValid = isLengthValid && hasNumber

  const inputCls = "h-11 rounded-xl border-border/70 bg-secondary/70 text-foreground placeholder:text-muted-foreground/50 focus:border-ring/60 focus:ring-0 text-sm transition-colors"
  const primaryBtn = "w-full h-11 rounded-xl premium-button font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
  const ghostBtn = "w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"

  const Logo = () => (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="w-12 h-12 rounded-2xl premium-logo flex items-center justify-center">
        <Bird className="w-6 h-6 text-background" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight">SocialNest</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {view === "forgot" ? "Reset your password" : activeTab === "login" ? "Sign in to your account" : "Create your account"}
        </p>
      </div>
    </div>
  )

  const ErrorBanner = () => error ? (
    <div className="flex items-start gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-xl text-sm text-destructive mb-4">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{error}</span>
    </div>
  ) : null

  return (
    <div className="min-h-screen flex items-center justify-center premium-shell p-4">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--ring)_18%,transparent),transparent_30rem)] pointer-events-none" />

      <div className="relative w-full max-w-[380px]">
        <div className="auth-card premium-card rounded-2xl p-8">
          <Logo />

          {/* Forgot password view */}
          {view === "forgot" && (
            <>
              <ErrorBanner />
              {resetStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="space-y-3">
                  <Input className={inputCls} placeholder="Your email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} disabled={isLoading} />
                  <button type="submit" disabled={isLoading} className={primaryBtn}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Code"}
                  </button>
                  <button type="button" onClick={() => { setView("main"); setError(null) }} className={ghostBtn}>← Back to sign in</button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3">
                  <Input className={inputCls} placeholder="6-digit code" value={resetOtp} onChange={e => setResetOtp(e.target.value)} disabled={isLoading} maxLength={6} />
                  <Input type="password" className={inputCls} placeholder="New password" value={newPass} onChange={e => setNewPass(e.target.value)} disabled={isLoading} />
                  <button type="submit" disabled={isLoading} className={primaryBtn}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Main auth view */}
          {view === "main" && (
            <>
              {/* Tabs */}
              <div className="flex bg-secondary/75 rounded-xl p-1 mb-6 border border-border/60">
                {(["login", "register"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setError(null); setStep(1) }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-card text-foreground shadow-sm border border-border/50"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>

              <ErrorBanner />

              {/* LOGIN */}
              {activeTab === "login" && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <Input className={inputCls} placeholder="Username or email" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} disabled={isLoading} />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      className={`${inputCls} pr-10`}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="submit" disabled={isLoading} className={primaryBtn}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => { setView("forgot"); setError(null) }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                      Forgot password?
                    </button>
                  </div>
                </form>
              )}

              {/* REGISTER */}
              {activeTab === "register" && (
                <>
                  {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-3">
                      <Input type="email" className={inputCls} placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                      <Input className={inputCls} placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} disabled={isLoading} />
                      <button type="submit" disabled={isLoading} className={primaryBtn}>
                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</> : "Continue"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                        Code sent to <span className="font-medium text-foreground">{email}</span>
                      </div>
                      <Input className={inputCls} placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} disabled={isLoading} />
                      <Input className={inputCls} placeholder="Verification code" value={otp} onChange={e => setOtp(e.target.value)} disabled={isLoading} maxLength={6} />
                      <Input type="password" className={inputCls} placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                      {password.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {[{ ok: isLengthValid, label: "At least 8 characters" }, { ok: hasNumber, label: "Contains a number" }].map(({ ok, label }) => (
                            <div key={label} className={`flex items-center gap-2 text-xs ${ok ? "text-foreground" : "text-muted-foreground"}`}>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${ok ? "bg-foreground border-foreground" : "border-border"}`}>
                                {ok && <Check className="w-2 h-2 text-background" />}
                              </div>
                              {label}
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="submit" disabled={isLoading || !isPasswordValid} className={`${primaryBtn} mt-1`}>
                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create Account"}
                      </button>
                      <button type="button" onClick={() => setStep(1)} className={ghostBtn}>← Change email</button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-5">
          © 2026 SocialNest · All rights reserved
        </p>
      </div>
    </div>
  )
}
