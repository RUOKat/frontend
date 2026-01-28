"use client";
import { useState, useEffect } from "react";
import { useActiveCat } from "@/contexts/active-cat-context";
import { fetchPetcamImages, PetcamImage } from "@/lib/backend-petcam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, RefreshCw, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export default function WebcamPage() {
  const { activeCat } = useActiveCat();
  const [images, setImages] = useState<PetcamImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PetcamImage | null>(null);

  const loadImages = async () => {
    if (!activeCat?.id) return;
    
    setLoading(true);
    try {
      const data = await fetchPetcamImages(activeCat.id);
      setImages(data);
    } catch (error) {
      console.error("Failed to load petcam images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [activeCat?.id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">펫캠 모니터링</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadImages}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
        {activeCat && (
          <p className="text-muted-foreground mt-1">
            {activeCat.name}의 펫캠 사진
          </p>
        )}
      </header>

      <main className="px-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageOff className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                아직 펫캠 사진이 없습니다
              </p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                펫캠으로 촬영된 사진이 여기에 표시됩니다
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card
                key={image.key}
                className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.key}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(image.lastModified)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(image.size)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 이미지 상세 보기 Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">펫캠 이미지 상세</DialogTitle>
          <DialogDescription className="sr-only">
            선택한 펫캠 이미지를 크게 볼 수 있습니다
          </DialogDescription>
          {selectedImage && (
            <div>
              <img
                src={selectedImage.url}
                alt={selectedImage.key}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <div className="p-4 bg-background">
                <p className="text-sm font-medium">
                  {formatDate(selectedImage.lastModified)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedImage.size)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
