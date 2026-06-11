"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./auth-provider"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { API_URL } from "@/lib/config"

interface CommentSectionProps {
  postId: number
  onUserClick: (id: number) => void 
}

export function CommentSection({ postId, onUserClick }: CommentSectionProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/comments/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id: postId, content: newComment }),
      })
      if (!res.ok) throw new Error("Failed to comment")
      return res.json()
    },
    onSuccess: () => {
      setNewComment("")
      queryClient.invalidateQueries({ queryKey: ["comments", postId] })
      queryClient.invalidateQueries({ queryKey: ["feed"] })
      queryClient.invalidateQueries({ queryKey: ["my-posts"] })
    },
  })

  const comments = data?.data || []

  return (
    <div className="pt-4 border-t border-border/50 space-y-5">
      <div className="space-y-3">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
              e.preventDefault()
              addCommentMutation.mutate()
            }
          }}
          rows={3}
          className="h-28 min-h-28 w-full resize-none rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm leading-6 shadow-sm [field-sizing:fixed] focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => addCommentMutation.mutate()}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="flex h-9 items-center gap-2 rounded-xl premium-button px-4 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          >
            {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Comment
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          comments.map((c: any) => (
            <div key={c.id} className="rounded-xl bg-secondary/40 px-3 py-2 text-sm">
              <span 
                className="font-bold cursor-pointer hover:underline"
                onClick={() => onUserClick(c.user_id)}
              >
                {c.username}
              </span>
              <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
