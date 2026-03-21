"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Loader2, LayoutGrid, List, X, PawPrint, Heart, Cat } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PostFeedCard } from "@/components/app/post-feed-card"
import { PostGridItem } from "@/components/app/post-grid-item"
import { fetchPosts, type Post } from "@/lib/backend-posts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function OkatPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    async function loadFeed() {
      try {
        const data = await fetchPosts()
        setPosts(data)
      } catch (error) {
        console.error("Failed to fetch posts:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFeed()
  }, [])

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    if (selectedPost?.id === postId) {
      setSelectedPost(null)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
          <h1 
            className="text-3xl font-bold"
            style={{ fontFamily: 'var(--font-gaegu)' }}
          >
            <span className="bg-gradient-to-r from-amber-900 via-rose-800 to-rose-900 bg-clip-text text-transparent">
              Meowments
            </span>
          </h1>
          <div className="flex bg-muted/50 rounded-lg p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="pt-4 px-4 sm:px-0 flex flex-col items-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-rose-400 mb-4" />
            <p className="font-medium text-rose-900/60" style={{ fontFamily: 'var(--font-gaegu)' }}>
              우리 냥이들 소식 가져오는 중...
            </p>
          </div>
        ) : (Array.isArray(posts) && posts.length > 0) ? (
          <div className="w-full max-w-lg">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                {posts.map((post) => (
                  <PostGridItem 
                    key={post.id} 
                    post={post} 
                    onClick={(p) => setSelectedPost(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostFeedCard key={post.id} post={post} onDelete={handleDeletePost} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <div className="w-24 h-24 rounded-full bg-orange-50/50 flex items-center justify-center mb-2">
                <Cat className="h-12 w-12 text-rose-900/20" />
             </div>
             <p className="text-2xl font-bold text-amber-950" style={{ fontFamily: 'var(--font-gaegu)' }}>
               아직 반짝이는 순간이 없어요
             </p>
             <p className="text-muted-foreground max-w-[280px] leading-relaxed" style={{ fontFamily: 'var(--font-gaegu)' }}>
               오늘의 기록을 마치고 사진을 올려주세요!<br />
               집사님들의 소중한 Meowments가<br />
               여기에 예쁘게 나타날 거예요 ✨
             </p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none sm:max-w-lg flex items-center justify-center h-[100dvh]">
          <DialogHeader className="sr-only">
            <DialogTitle>기록 상세보기</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="relative w-full max-w-lg mx-auto bg-background rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
               <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full bg-background/50 backdrop-blur-md"
                onClick={() => setSelectedPost(null)}
               >
                 <X className="h-4 w-4" />
               </Button>
               <div className="overflow-y-auto max-h-[90dvh]">
                 <PostFeedCard post={selectedPost} onDelete={handleDeletePost} />
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
