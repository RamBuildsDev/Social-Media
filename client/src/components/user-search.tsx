"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./auth-provider"
import { Input } from "@/components/ui/input"
import { Loader2, Search, UserPlus, UserMinus } from "lucide-react"
import { API_URL } from "@/lib/config"

interface UserSearchProps {
  onUserClick: (id: number) => void
  requireAuth?: () => void
}

export function UserSearch({ onUserClick, requireAuth }: UserSearchProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")

  const { data: followingData } = useQuery({
    queryKey: ["following"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/following`, { headers: { Authorization: `Bearer ${token}` } })
      return res.json()
    },
    enabled: !!token,
  })

  const followingIds = new Set(followingData?.users?.map((u: any) => u.id))

  const { data: searchData, isLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { users: [] }
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const res = await fetch(`${API_URL}/api/users/search?q=${searchTerm}`, { headers })
      return res.json()
    },
    enabled: searchTerm.length > 0,
  })

  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      await fetch(`${API_URL}/api/users/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] })
      queryClient.invalidateQueries({ queryKey: ["feed"] })
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      await fetch(`${API_URL}/api/users/unfollow`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] })
      queryClient.invalidateQueries({ queryKey: ["feed"] })
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  return (
    <div className="space-y-5 pb-20">
      {/* Page header */}
      <div className="premium-card rounded-2xl p-4">
        <h2 className="text-xl font-bold tracking-tight">Explore</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Find and follow people</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 h-11 rounded-xl border-border/60 bg-card/80 text-sm focus:border-ring/50 focus:ring-0 shadow-sm"
        />
      </div>

      {/* Results */}
      <div className="space-y-1.5">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {searchData?.users?.map((user: any) => {
          const isFollowing = followingIds.has(user.id)
          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-xl premium-card hover:border-ring/40 transition-colors cursor-pointer"
              onClick={e => {
                if ((e.target as HTMLElement).closest("button")) return
                onUserClick(user.id)
              }}
            >
              <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {user.profile_pic_url
                  ? <img src={user.profile_pic_url} alt="" className="w-full h-full object-cover rounded-full" />
                  : user.full_name?.charAt(0).toUpperCase()
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>

              <button
                onClick={() => {
                  if (!token) {
                    requireAuth?.()
                    return
                  }
                  isFollowing ? unfollowMutation.mutate(user.id) : followMutation.mutate(user.id)
                }}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex-shrink-0 ${
                  !token
                    ? "premium-button hover:opacity-90"
                    : isFollowing
                    ? "border border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                    : "premium-button hover:opacity-90"
                }`}
              >
                {!token
                  ? <><UserPlus className="w-3.5 h-3.5" /> Sign in</>
                  : isFollowing
                  ? <><UserMinus className="w-3.5 h-3.5" /> Unfollow</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                }
              </button>
            </div>
          )
        })}

        {searchTerm && searchData?.users?.length === 0 && !isLoading && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">No users found for "<span className="text-foreground font-medium">{searchTerm}</span>"</p>
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Start typing to search</p>
          </div>
        )}
      </div>
    </div>
  )
}
