"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ArrowRight, Bell, Bird, CheckCircle2, ChevronRight, Globe2, Heart,
  Image, LockKeyhole, MessageCircle, Moon, Search, Shield, Sparkles, Sun, Users
} from "lucide-react"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-xl premium-outline flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

export function LandingPage() {
  const router = useRouter()
  const goToAuth = (tab?: string) => router.push(`/?auth=true${tab ? `&tab=${tab}` : ""}`)
  const explore = () => router.push("/?v=feed&explore=true")

  const metrics = [
    ["10K+", "members"],
    ["50K+", "posts"],
    ["99.9%", "uptime"],
  ]

  const features = [
    { icon: Users, title: "Relationship graph", desc: "Follow creators, friends, and teams with clean discovery flows." },
    { icon: Image, title: "Visual publishing", desc: "Share image-led posts in a focused feed that keeps content premium." },
    { icon: Bell, title: "Realtime signals", desc: "Likes, comments, and follows arrive instantly without refreshing." },
    { icon: Shield, title: "Controlled privacy", desc: "Comment permissions and account settings stay close to the workflow." },
  ]

  return (
    <div className="min-h-screen premium-shell text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/76 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="premium-logo flex h-9 w-9 items-center justify-center rounded-xl">
              <Bird className="h-4 w-4 text-background" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">SocialNest</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Social OS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={explore} className="hidden h-9 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground sm:block">
              Explore
            </button>
            <button onClick={() => goToAuth()} className="hidden h-9 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground sm:block">
              Sign in
            </button>
            <button onClick={() => goToAuth("register")} className="premium-button h-9 rounded-xl px-4 text-sm font-semibold transition hover:opacity-90">
              Get started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.02fr_0.98fr] md:px-8 md:pb-24 md:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b9955e]" />
              Premium community platform
              <ChevronRight className="h-3.5 w-3.5" />
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[0.98] tracking-tight md:text-7xl">
              SocialNest
              <span className="block text-muted-foreground">feels like a private network built for taste.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              A refined social workspace for posting, discovering people, and managing your digital circle without the clutter of a commodity feed.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => goToAuth("register")} className="premium-button flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold transition hover:opacity-90">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={explore} className="premium-outline flex h-12 items-center justify-center rounded-xl px-6 text-sm font-bold text-foreground transition hover:bg-accent/60">
                Explore public feed
              </button>
            </div>

            <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
              {metrics.map(([value, label]) => (
                <div key={label} className="premium-outline rounded-2xl px-4 py-3">
                  <p className="text-xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="premium-card overflow-hidden rounded-[1.45rem]">
              <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d96c5f]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d8b16b]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#65a887]" />
                </div>
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground">app.socialnest.co</div>
              </div>

              <div className="grid min-h-[420px] grid-cols-[92px_1fr] md:grid-cols-[170px_1fr]">
                <aside className="border-r border-border/60 bg-sidebar/70 p-3">
                  <div className="mb-5 flex items-center gap-2 px-1">
                    <div className="premium-logo flex h-7 w-7 items-center justify-center rounded-lg">
                      <Bird className="h-3.5 w-3.5 text-background" />
                    </div>
                    <span className="hidden text-xs font-bold md:block">SocialNest</span>
                  </div>
                  {[
                    [Globe2, "Home"],
                    [Search, "Explore"],
                    [Users, "Profile"],
                    [LockKeyhole, "Settings"],
                  ].map(([Icon, label], index) => (
                    <div key={label as string} className={`mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${index === 0 ? "premium-button" : "text-muted-foreground"}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">{label as string}</span>
                    </div>
                  ))}
                </aside>

                <div className="space-y-3 p-4 md:p-5">
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Today</p>
                        <p className="mt-1 text-lg font-bold">Your social workspace</p>
                      </div>
                      <div className="rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground">Live</div>
                    </div>
                  </div>

                  {([
                    ["Priya Sharma", "@priya_s", "Design review wrapped. Sharing the moodboard that finally clicked.", true, "142", "18"],
                    ["Arjun Mehta", "@arjunm", "The new activity feed is fast enough to feel invisible.", false, "87", "9"],
                  ] as const).map(([name, handle, copy, hasMedia, likes, comments]) => (
                    <article key={name} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-sm font-bold">{(name as string)[0]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-tight">{name}</p>
                          <p className="text-xs text-muted-foreground">{handle}</p>
                        </div>
                        <span className="ml-auto text-[11px] text-muted-foreground">2h</span>
                      </div>
                      <p className="text-sm leading-6 text-foreground/85">{copy}</p>
                      {hasMedia && <div className="mt-3 h-24 rounded-xl border border-border/60 bg-[linear-gradient(135deg,#eadcc5,#fffdfa_48%,#b9955e)] dark:bg-[linear-gradient(135deg,#222630,#17191f_48%,#5b482c)]" />}
                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-[#d96c5f]" />{likes}</span>
                        <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />{comments}</span>
                        <span className="ml-auto flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#b9955e]" />Suggested</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-16 md:grid-cols-4 md:px-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="premium-card rounded-2xl p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-16 md:grid-cols-3 md:px-8">
          {[
            ["What guests can do", "Browse suggested posts, open public profiles, and search for people before creating an account."],
            ["What sign-in unlocks", "Like posts, comment in conversations, follow users, publish media posts, and manage your own profile."],
            ["What SocialNest is", "A cleaner social layer for discovering people and sharing updates without turning every screen into noise."],
          ].map(([title, desc]) => (
            <div key={title} className="premium-card rounded-2xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Platform</p>
              <h2 className="mt-3 text-lg font-bold tracking-tight">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-5xl px-5 py-20 text-center md:px-8">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">A calmer, sharper way to be social.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            Built for people who want the speed of a social network with the polish and control of modern SaaS.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground">
            {["Free to start", "No credit card", "Realtime by default"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#b9955e]" />
                {item}
              </span>
            ))}
          </div>
          <button onClick={() => goToAuth("register")} className="premium-button mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-bold transition hover:opacity-90">
            Start building your circle
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={explore} className="ml-0 mt-3 inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-bold text-muted-foreground transition hover:text-foreground sm:ml-3">
            Browse first
          </button>
        </section>
      </main>
    </div>
  )
}
