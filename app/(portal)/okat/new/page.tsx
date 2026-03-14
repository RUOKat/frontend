"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useActiveCat } from "@/contexts/active-cat-context"
import { uploadImage, createPost } from "@/lib/backend-posts"

export default function NewPostPage() {
  const router = useRouter()
  const { activeCatId } = useActiveCat()
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        alert("이미지 파일만 업로드 가능합니다.")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.")
        return
      }

      setSelectedImage(file)
      
      // Create preview string
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedImage || !activeCatId) {
      alert("이미지를 선택해주시고, 활성화된 고양이가 있는지 확인해주세요.")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload the image
      const imageUrl = await uploadImage(selectedImage)
      
      // 2. Create the post
      await createPost(activeCatId, imageUrl, caption)
      
      // 3. Navigate back to feed
      router.push("/okat")
      router.refresh() // To ensure feed is re-fetched
    } catch (error) {
       console.error("Failed to create post", error)
       alert("게시물 업로드에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background border-b border-border/50">
        <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">새 게시물</h1>
          <Button 
            variant="ghost" 
            onClick={handleSubmit} 
            disabled={!selectedImage || isSubmitting}
            className="text-primary font-semibold disabled:text-muted-foreground"
          >
            공유
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 flex flex-col items-center">
        {/* Image Preview / Selector */}
        <div 
          className="w-full aspect-square bg-muted/30 border border-dashed border-border rounded-xl flex items-center justify-center overflow-hidden relative mb-6 cursor-pointer hover:bg-muted/50 transition"
          onClick={() => !isSubmitting && fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <Image 
               src={previewUrl} 
               alt="Preview" 
               fill 
               className="object-cover" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
               <ImagePlus className="h-10 w-10" />
               <p className="text-sm font-medium">사진을 선택하세요</p>
            </div>
          )}
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
            disabled={isSubmitting}
          />
        </div>

        {/* Caption Input */}
        <div className="w-full">
          <Textarea 
             placeholder="자랑하고 싶은 반려동물의 모습을 자유롭게 적어주세요..."
             value={caption}
             onChange={(e) => setCaption(e.target.value)}
             className="min-h-[120px] resize-none text-base border-border/50 focus-visible:ring-1 focus-visible:ring-primary bg-background"
             disabled={isSubmitting}
          />
        </div>
        
        {isSubmitting && (
           <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="font-medium text-foreground">게시물을 올리는 중...</p>
           </div>
        )}
      </main>
    </div>
  )
}
