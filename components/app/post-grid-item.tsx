"use client"

import Image from "next/image"
import { Post } from "@/lib/backend-posts"
import { getMediaUrl } from "@/lib/backend"

interface PostGridItemProps {
  post: Post
  onClick: (post: Post) => void
}

export function PostGridItem({ post, onClick }: PostGridItemProps) {
  const imageUrl = getMediaUrl(post.imageUrl)

  return (
    <button 
      onClick={() => onClick(post)}
      className="relative aspect-square w-full overflow-hidden bg-muted/20 hover:opacity-90 transition-opacity active:scale-[0.98]"
    >
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
          sizes="(max-width: 768px) 33vw, 200px"
        />
      )}
    </button>
  )
}
