"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "./auth-provider"
import { PostCard } from "./post-card"
import { Loader2, Users, Sparkles } from "lucide-react"
import { API_URL } from "@/lib/config"

interface FeedProps {
  onUserClick: (id: number) => void
  requireAuth?: () => void
}

export function Feed({ onUserClick, requireAuth }: FeedProps) {
  const { token, user } = useAuth()

  const { data: feedData, isLoading, error } = useQuery({
    queryKey: ["feed", user?.id],
    queryFn: async () => {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const res = await fetch(`${API_URL}/api/posts/feed`, { headers })
      if (!res.ok) throw new Error("Failed to fetch feed")
      return res.json()
    },
    enabled: !!token || !user,
  })

  const posts = feedData?.posts || []

  if (isLoading) return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-4 w-4 rounded shimmer" />
        <div className="h-4 w-20 rounded-lg shimmer" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="premium-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full shimmer" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded shimmer" />
              <div className="h-3 w-16 rounded shimmer" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded shimmer" />
            <div className="h-3 w-3/4 rounded shimmer" />
          </div>
          <div className="h-44 w-full rounded-xl shimmer" />
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="premium-card flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
      <p className="text-sm font-bold">Could not reach the feed API</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Start the backend server on port 5000 or set `NEXT_PUBLIC_API_URL` to your deployed API URL.
      </p>
    </div>
  )

  if (!posts || posts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl premium-outline flex items-center justify-center">
        <Users className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">Your feed is empty</h3>
        <p className="text-xs text-muted-foreground max-w-xs">Follow people or explore to see posts here.</p>
      </div>
    </div>
  )

  const followedPosts = posts.filter((p: any) => !p.is_suggested)
  const suggestedPosts = posts.filter((p: any) => p.is_suggested)

  return (
    <div className="pb-20">
      {followedPosts.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Following</span>
        </div>
      )}

      {followedPosts.map((post: any) => (
        <PostCard
          key={post.id} id={post.id} content={post.content} media_url={post.media_url}
          onUserClick={onUserClick}
          user={{ username: post.username, full_name: post.full_name, id: post.user_id, profile_pic_url: post.profile_pic_url }}
          createdAt={post.created_at} likeCount={post.like_count || 0} commentCount={post.comment_count || 0}
          hasLiked={post.has_liked} commentsEnabled={post.comments_enabled} isSuggested={false}
          requireAuth={requireAuth}
        />
      ))}

      {suggestedPosts.length > 0 && (
        <>
          <div className="flex items-center gap-2 my-5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Suggested</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          {suggestedPosts.map((post: any) => (
            <PostCard
              key={post.id} id={post.id} content={post.content} media_url={post.media_url}
              onUserClick={onUserClick}
              user={{ username: post.username, full_name: post.full_name, id: post.user_id, profile_pic_url: post.profile_pic_url }}
              createdAt={post.created_at} likeCount={post.like_count || 0} commentCount={post.comment_count || 0}
              hasLiked={post.has_liked} commentsEnabled={post.comments_enabled} isSuggested={true}
              requireAuth={requireAuth}
            />
          ))}
        </>
      )}
    </div>
  )
}
