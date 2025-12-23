"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OptionalConsentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName?: string
  onConfirm?: () => void
}

// TODO: 사진 업로드/영상 분석 진입 시 OptionalConsentModal 사용
export function OptionalConsentModal({
  open,
  onOpenChange,
  featureName = "해당 기능",
  onConfirm,
}: OptionalConsentModalProps) {
  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>선택 동의</DialogTitle>
          <DialogDescription>
            {featureName}은(는) 기록과 변화 감지를 돕기 위해 사용됩니다. 동의하시면 이용할 수 있어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            나중에
          </Button>
          <Button type="button" onClick={handleConfirm}>
            동의하고 계속
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
