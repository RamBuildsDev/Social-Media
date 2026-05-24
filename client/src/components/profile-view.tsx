"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./auth-provider"
import { PostCard } from "./post-card"
import { FollowModal } from "./follow-modal"
import { ProfileUploadModal } from "./profile-upload-modal"
import { Loader2, Calendar, Mail, UserPlus, UserMinus, Camera, Grid3X3 } from "lucide-react"
import { API_URL } from "@/lib/config"

interface ProfileViewProps {
  targetUserId?: number | null
  onUserClick?: (id: number) => void
  requireAuth?: () => void
}

export function ProfileView({ targetUserId, onUserClick, requireAuth }: ProfileViewProps) {
  const { user: currentUser, token } = useAuth()
  const queryClient = useQueryClient()
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const isMe = !targetUserId || Number(targetUserId) === Number(currentUser?.id)

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", isMe ? "me" : targetUserId],
    queryFn: async () => {
      const url = isMe ? `${API_URL}/api/users/stats` : `${API_URL}/api/users/${targetUserId}/profile`
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: !!token || !isMe,
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["posts", isMe ? "me" : targetUserId],
    queryFn: async () => {
      const url = isMe ? `${API_URL}/api/posts/my` : `${API_URL}/api/posts/user/${targetUserId}`
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const res = await fetch(url, { headers })
      return res.json()
    },
    enabled: !!token || !isMe,
  })

  const displayUser = isMe ? currentUser : profileData?.user
  const stats = isMe ? profileData : profileData?.user
  const isFollowing = profileData?.user?.is_following
  const profilePicUrl = isMe ? (profileData?.profile_pic_url || displayUser?.profile_pic_url) : displayUser?.profile_pic_url
  const posts = postsData?.posts || []

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isFollowing ? "unfollow" : "follow"
      await fetch(`${API_URL}/api/users/${endpoint}`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: targetUserId }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", targetUserId] })
      queryClient.invalidateQueries({ queryKey: ["following"] })
    }
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData()
      formData.append("avatar", blob)
      const res = await fetch(`${API_URL}/api/users/profile-pic`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData
      })
      if (!res.ok) throw new Error("Upload failed")
      return res.json()
    },
    onSuccess: () => {
      setIsUploadOpen(false); setSelectedImage(null)
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] })
      window.location.reload()
    }
  })

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener("load", () => setSelectedImage(reader.result as string))
      reader.readAsDataURL(e.target.files[0])
      setIsUploadOpen(true)
    }
  }

  if (profileLoading) return (
    <div className="space-y-4">
      <div className="premium-card rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full shimmer flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-32 rounded shimmer" />
            <div className="h-3 w-20 rounded shimmer" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!displayUser) return (
    <div className="text-center py-16 text-muted-foreground text-sm">User not found</div>
  )

  const joined = displayUser.created_at
    ? new Date(displayUser.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Card */}
      <div className="premium-card rounded-2xl overflow-hidden">
        {/* Cover strip */}
        <div className="h-24 profile-cover" />

        <div className="px-5 pb-5">
          {/* Avatar + follow */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-card bg-secondary flex items-center justify-center text-xl font-bold overflow-hidden">
                {profilePicUrl
                  ? <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                  : displayUser.full_name?.charAt(0).toUpperCase()
                }
              </div>
              {isMe && (
                <label className="absolute bottom-0 right-0 w-6 h-6 premium-button rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity border-2 border-card">
                  <Camera className="w-3 h-3" />
                  <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                </label>
              )}
            </div>

            {!isMe && (
              <button
                onClick={() => token ? toggleFollowMutation.mutate() : requireAuth?.()}
                disabled={toggleFollowMutation.isPending}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                  !token
                    ? "premium-button hover:opacity-90"
                    : isFollowing
                    ? "border border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                    : "premium-button hover:opacity-90"
                }`}
              >
                {!token
                  ? <><UserPlus className="w-3.5 h-3.5" /> Sign in to follow</>
                  : toggleFollowMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : isFollowing
                    ? <><UserMinus className="w-3.5 h-3.5" /> Unfollow</>
                    : <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                }
              </button>
            )}
          </div>

          {/* Name */}
          <div className="space-y-0.5 mb-3">
            <h2 className="text-lg font-bold leading-tight tracking-tight">{displayUser.full_name}</h2>
            <p className="text-sm text-muted-foreground">@{displayUser.username}</p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
            {isMe && displayUser.email && (
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{displayUser.email}</span>
            )}
            {joined && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {joined}</span>}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => isMe && setModalType("followers")}
              disabled={!isMe}
              className={`text-center ${isMe ? "hover:opacity-70" : ""} transition-opacity`}
            >
              <p className="text-base font-bold leading-tight">{stats?.followers || 0}</p>
              <p className="text-[11px] text-muted-foreground">Followers</p>
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={() => isMe && setModalType("following")}
              disabled={!isMe}
              className={`text-center ${isMe ? "hover:opacity-70" : ""} transition-opacity`}
            >
              <p className="text-base font-bold leading-tight">{stats?.following || 0}</p>
              <p className="text-[11px] text-muted-foreground">Following</p>
            </button>
          </div>
        </div>
      </div>

      {/* Posts section */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Grid3X3 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
            Posts {posts.length > 0 && `· ${posts.length}`}
          </span>
        </div>

        {postsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-0">
            {posts.map((post: any) => (
              <PostCard
                key={post.id}
                id={post.id}
                content={post.content}
                media_url={post.media_url}
                user={{ username: post.username, full_name: post.full_name, id: post.user_id, profile_pic_url: post.profile_pic_url }}
                createdAt={post.created_at}
                likeCount={post.like_count || 0}
                commentCount={post.comment_count || 0}
                hasLiked={post.has_liked}
                commentsEnabled={post.comments_enabled}
                onUserClick={onUserClick || (() => {})}
                requireAuth={requireAuth}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-card/45">
            <Grid3X3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No posts yet</p>
          </div>
        )}
      </div>

      {isMe && modalType && (
        <FollowModal isOpen={!!modalType} onClose={() => setModalType(null)} type={modalType} />
      )}

      {isUploadOpen && selectedImage && (
        <ProfileUploadModal
          imageSrc={selectedImage}
          isOpen={isUploadOpen}
          onClose={() => { setIsUploadOpen(false); setSelectedImage(null) }}
          onUpload={(blob) => uploadAvatarMutation.mutate(blob)}
          isLoading={uploadAvatarMutation.isPending}
        />
      )}
    </div>
  )
}
