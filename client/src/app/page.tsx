"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-provider"
import { AuthFlow } from "@/components/auth-flow"
import { Feed } from "@/components/feed"
import { UserSearch } from "@/components/user-search"
import { ProfileView } from "@/components/profile-view"
import { SettingsView } from "@/components/settings-view"
import { CreatePostModal } from "@/components/create-post-modal"
import { NotificationsModal } from "@/components/notifications-modal"
import { SocketProvider, useSocket } from "@/components/socket-provider"
import { Home, Search, User, Settings, Bell, Plus, LogOut, Sun, Moon, Menu, X, Bird, Sparkles } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import { useEffect } from "react"
import { LandingPage } from "@/components/landing-page"

export default function PageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl premium-logo flex items-center justify-center">
            <Bird className="w-5 h-5 text-background" />
          </div>
          <div className="flex gap-1">
            {[0, 150, 300].map(d => (
              <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      </div>
    }>
      <SocketProvider>
        <PageContent />
      </SocketProvider>
    </Suspense>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

function PageContent() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { socket } = useSocket()

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const currentView = searchParams.get("v") || "feed"
  const viewProfileId = searchParams.get("id") ? Number(searchParams.get("id")) : null
  const isNotifOpen = searchParams.get("modal") === "notifications"
  const showAuth = searchParams.get("auth") === "true"
  const isPublicAppView = !user && (searchParams.has("v") || searchParams.get("explore") === "true")

  const navigate = (view: string, id?: number | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("v", view)
    if (id) params.set("id", id.toString())
    else params.delete("id")
    params.delete("modal")
    router.push(`?${params.toString()}`)
    setIsMobileSidebarOpen(false)
  }

  const toggleNotifications = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (open) { params.set("modal", "notifications"); setUnreadCount(0) }
    else params.delete("modal")
    router.push(`?${params.toString()}`)
  }

  useEffect(() => {
    if (!socket) return
    const handle = () => setUnreadCount(p => p + 1)
    socket.on("notification", handle)
    return () => { socket.off("notification", handle) }
  }, [socket])

  // Loading state
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl premium-logo flex items-center justify-center animate-pulse">
          <Bird className="w-5 h-5 text-background" />
        </div>
      </div>
    </div>
  )

  // Not logged in — show landing or auth
  if (!user && !isPublicAppView) {
    if (showAuth) return <AuthFlow />
    return <LandingPage />
  }

  // Logged in — show app
  const navItems = [
    { icon: Home, label: "Home", view: "feed" },
    { icon: Search, label: "Explore", view: "search" },
    ...(user ? [
      { icon: User, label: "Profile", view: "profile" },
      { icon: Settings, label: "Settings", view: "settings" },
    ] : []),
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl premium-logo flex items-center justify-center">
            <Bird className="w-3.5 h-3.5 text-background" />
          </div>
          <div className="min-w-0">
            <span className="block font-bold text-sm tracking-tight">SocialNest</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Studio</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ icon: Icon, label, view }) => {
          const isActive = currentView === view && (view !== "profile" || !viewProfileId)
          return (
            <button
              key={view}
              onClick={() => navigate(view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive ? "premium-button" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          )
        })}

        {user && (
          <button
            onClick={() => toggleNotifications(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              isNotifOpen ? "premium-button" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/80"
            }`}
          >
            <Bell className="w-4 h-4 flex-shrink-0" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto min-w-5 h-5 bg-[#b9955e] text-white text-[10px] font-bold px-1.5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border/70 space-y-2">
        <button
          onClick={() => user ? setIsCreatePostOpen(true) : router.push("/?auth=true&tab=login")}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl premium-button font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          {user ? "New Post" : "Sign in to post"}
        </button>

        {user ? <div className="flex items-center gap-2.5 p-2 rounded-xl premium-outline hover:bg-accent/70 transition-colors group cursor-default">
          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
            {(user as any).profile_pic_url
              ? <img src={(user as any).profile_pic_url} alt="" className="w-full h-full object-cover" />
              : user.full_name?.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-tight">{user.full_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {user.username ? `@${user.username}` : user.email}
            </p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-1 rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div> : (
          <div className="space-y-2 rounded-xl premium-outline p-3">
            <p className="text-xs font-semibold">Browsing as guest</p>
            <p className="text-[11px] leading-4 text-muted-foreground">Sign in to like, comment, follow, and publish.</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen premium-shell overflow-hidden">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl flex flex-col">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile overlay sidebar */}
      {isMobile && isMobileSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-foreground/20 modal-backdrop z-20" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-border z-30 flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isMobile && (
          <div className="border-b border-border bg-sidebar/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl premium-logo flex items-center justify-center">
                <Bird className="w-3 h-3 text-background" />
              </div>
              <span className="font-bold text-sm">SocialNest</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button onClick={() => toggleNotifications(true)} className="relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-foreground rounded-full" />}
              </button>
              <button onClick={() => setIsMobileSidebarOpen(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
            {currentView === "feed" && (
              <div className="mb-5 premium-card rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{user ? "Command center" : "Public preview"}</p>
                  <h1 className="text-xl font-bold tracking-tight mt-1">{user ? "Your social workspace" : "Explore SocialNest"}</h1>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-[#b9955e]" />
                  Live feed
                </div>
              </div>
            )}
            {!user && (
              <div className="mb-5 rounded-2xl border border-[#b9955e]/30 bg-[#b9955e]/10 p-4">
                <p className="text-sm font-bold">You can browse freely.</p>
                <p className="mt-1 text-sm text-muted-foreground">Create an account when you want to like, comment, follow someone, or publish your own post.</p>
              </div>
            )}
            {currentView === "feed" && <Feed onUserClick={(id) => navigate("profile", id)} requireAuth={() => router.push("/?auth=true&tab=login")} />}
            {currentView === "search" && <UserSearch onUserClick={(id) => navigate("profile", id)} requireAuth={() => router.push("/?auth=true&tab=login")} />}
            {currentView === "profile" && <ProfileView targetUserId={viewProfileId} onUserClick={(id) => navigate("profile", id)} requireAuth={() => router.push("/?auth=true&tab=login")} />}
            {user && currentView === "settings" && <SettingsView />}
          </div>
        </div>
      </main>

      {isMobile && (
        <button onClick={() => user ? setIsCreatePostOpen(true) : router.push("/?auth=true&tab=login")} className="fixed bottom-6 right-6 z-10 w-12 h-12 premium-button rounded-2xl flex items-center justify-center shadow-xl hover:opacity-90 active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      )}

      {user && <CreatePostModal isOpen={isCreatePostOpen} onClose={() => setIsCreatePostOpen(false)} />}
      {user && <NotificationsModal isOpen={isNotifOpen} onClose={() => toggleNotifications(false)} onUserClick={(id) => navigate("profile", id)} />}
    </div>
  )
}
