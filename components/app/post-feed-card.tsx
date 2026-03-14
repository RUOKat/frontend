"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Post, togglePostLike, deletePost } from "@/lib/backend-posts"
import { BASE_URL, getMediaUrl } from "@/lib/backend"
import { useAuth } from "@/contexts/auth-context"

interface PostCardProps {
  post: Post
  onLikeToggle?: (postId: string, newLikedState: boolean) => void
  onDelete?: (postId: string) => void
}

export function PostFeedCard({ post, onLikeToggle, onDelete }: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(post.isLikedByMe)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [isLiking, setIsLiking] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = user?.id === post.author.id

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    // Optimistic UI update
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1)
    
    if (onLikeToggle) {
        onLikeToggle(post.id, newLikedState)
    }

    try {
      await togglePostLike(post.id)
    } catch (error) {
       console.error("Failed to toggle like", error)
       // Revert on failure
       setIsLiked(!newLikedState)
       setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1)
    } finally {
      setIsLiking(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deletePost(post.id)
      if (onDelete) {
        onDelete(post.id)
      }
    } catch (error) {
      console.error("Failed to delete post:", error)
      alert("게시물을 삭제하지 못했습니다.")
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
    }
  }

  // Handle local vs remote image URLs
  const imageUrl = getMediaUrl(post.imageUrl)
  const profileUrl = getMediaUrl(post.author.profilePhoto)
  const catProfileUrl = getMediaUrl(post.cat.profilePhoto)

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden border-border/50 bg-background mb-4">
      {/* Header */}
      <CardHeader className="flex flex-row items-center p-3 space-x-3 space-y-0">
        <Avatar className="w-10 h-10 border border-border/50 shadow-sm">
          <AvatarImage src={catProfileUrl || profileUrl} alt={post.cat.name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
             {post.cat.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{post.cat.name}</p>
          <p className="text-xs text-muted-foreground truncate">with {post.author.name}</p>
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setShowDeleteAlert(true)}
              >
                삭제하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      {/* Media (Image or Video) */}
      <div className="relative w-full aspect-square bg-muted/20">
        {imageUrl.toLowerCase().match(/\.(mp4|mov|webm|quicktime)$/) ? (
           <video
             src={imageUrl}
             className="w-full h-full object-cover"
             autoPlay
             muted
             loop
             playsInline
           />
        ) : (
          <Image
            src={imageUrl}
            alt={post.caption || "Cat photo"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
            priority={false}
          />
        )}
      </div>

      {/* Actions */}
      <CardContent className="p-3 pb-1">
        <div className="flex items-center space-x-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full transition-colors ${
              isLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-foreground hover:bg-muted"
            }`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
            <span className="sr-only">Like</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-foreground hover:bg-muted">
             <MessageCircle className="h-6 w-6" />
             <span className="sr-only">Comment</span>
          </Button>
        </div>
        {likesCount > 0 && (
          <p className="text-sm font-semibold text-foreground">
            좋아요 {likesCount.toLocaleString()}개
          </p>
        )}
      </CardContent>

      {/* Caption & Timestamp */}
      <CardFooter className="flex flex-col items-start p-3 pt-0">
        {post.caption && (
          <div className="text-sm text-foreground mb-1 leading-relaxed">
            <span className="font-semibold mr-2">{post.cat.name}</span>
            {post.caption}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
        </p>
      </CardFooter>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시물을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 게시물은 복구할 수 없습니다. 정말 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
