"use client";
import { useState, useEffect, useRef } from "react";
import { useActiveCat } from "@/contexts/active-cat-context";
import { fetchPetcamImages, deletePetcamImage, uploadPetcamImage, PetcamImage } from "@/lib/backend-petcam";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, RefreshCw, ImageOff, AlertTriangle, CheckCircle, Info, Trash2, Upload, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// FGS 점수에 따른 색상과 레이블
function getFgsInfo(score: number) {
  if (score <= 2) {
    return { color: "bg-green-500", textColor: "text-green-600", label: "정상", icon: CheckCircle };
  } else if (score <= 4) {
    return { color: "bg-yellow-500", textColor: "text-yellow-600", label: "주의", icon: Info };
  } else {
    return { color: "bg-red-500", textColor: "text-red-600", label: "위험", icon: AlertTriangle };
  }
}

export default function WebcamPage() {
  const { activeCat } = useActiveCat();
  const [images, setImages] = useState<PetcamImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<PetcamImage | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fgsHelpOpen, setFgsHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDelete = async () => {
    if (!activeCat?.id || !selectedImage) return;

    setDeleting(true);
    try {
      const success = await deletePetcamImage(activeCat.id, selectedImage.key);
      if (success) {
        toast.success("이미지가 삭제되었습니다");
        setImages(prev => prev.filter(img => img.key !== selectedImage.key));
        setSelectedImage(null);
      } else {
        toast.error("이미지 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("이미지 삭제에 실패했습니다");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeCat?.id) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadPetcamImage(activeCat.id, file);
      if (result) {
        toast.success("이미지가 업로드되었습니다");
        // 목록 새로고침
        await loadImages();
      } else {
        toast.error("이미지 업로드에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("이미지 업로드에 실패했습니다");
    } finally {
      setUploading(false);
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setFgsHelpOpen(true)}
            >
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadImages}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className={`h-4 w-4 mr-2 ${uploading ? "animate-pulse" : ""}`} />
              {uploading ? "업로드 중..." : "사진 업로드"}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
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
            {images.map((image) => {
              const fgsInfo = image.fgsScore !== undefined ? getFgsInfo(image.fgsScore) : null;
              const FgsIcon = fgsInfo?.icon;
              
              return (
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
                    {/* FGS 점수 배지 */}
                    {fgsInfo && (
                      <div className="absolute top-2 right-2">
                        <Badge className={`${fgsInfo.color} text-white flex items-center gap-1`}>
                          {FgsIcon && <FgsIcon className="h-3 w-3" />}
                          FGS {image.fgsScore}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(image.lastModified)}
                    </p>
                    {fgsInfo && (
                      <p className={`text-xs font-medium ${fgsInfo.textColor}`}>
                        {fgsInfo.label}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <div className="p-4 bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(selectedImage.lastModified)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedImage.size)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                </div>
                
                {/* FGS 분석 결과 */}
                {selectedImage.fgsScore !== undefined && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const fgsInfo = getFgsInfo(selectedImage.fgsScore!);
                        const FgsIcon = fgsInfo.icon;
                        return (
                          <>
                            <Badge className={`${fgsInfo.color} text-white`}>
                              <FgsIcon className="h-3 w-3 mr-1" />
                              FGS 점수: {selectedImage.fgsScore}점
                            </Badge>
                            <span className={`text-sm font-medium ${fgsInfo.textColor}`}>
                              {fgsInfo.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    {selectedImage.fgsExplanation && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedImage.fgsExplanation.replace(/^"|"$/g, '')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이미지를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 이미지가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FGS 설명 Dialog */}
      <Dialog open={fgsHelpOpen} onOpenChange={setFgsHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              FGS 통증 분석이란?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>FGS(Feline Grimace Scale) 통증 분석 서비스</strong>는 AI가 고양이 얼굴을 자동으로 인식하고, 
              귀·눈·입·수염·머리 자세 등 5가지 항목의 48개 랜드마크를 분석하여 통증 점수(0~10점)를 산출합니다.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              4점 이상일 경우 수의사 상담이나 추가 검진을 권장하며, 
              보호자가 고양이의 통증 상태를 객관적으로 파악할 수 있도록 돕습니다.
            </p>
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">점수 기준</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-green-500 text-white">0~2점</Badge>
                <span className="text-muted-foreground">정상</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-yellow-500 text-white">3~4점</Badge>
                <span className="text-muted-foreground">주의 필요</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-red-500 text-white">5점 이상</Badge>
                <span className="text-muted-foreground">수의사 상담 권장</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
