"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Gift } from "lucide-react"

export function CareBenefitPromo() {
  return (
    <Alert className="border-amber-300/50 bg-gradient-to-br from-amber-50 via-orange-50/50 to-card dark:from-amber-950/30 dark:via-orange-950/20 dark:to-card px-2 shadow-sm">
      <AlertTitle className="flex items-center gap-2">
        <Gift className="text-amber-500" />
        케어 참여 혜택
      </AlertTitle>
      <AlertDescription className="w-full">
        <div className="space-y-3">
          <div className="w-full rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-background/70 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              <span className="rounded-full border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 text-amber-700 dark:text-amber-300">
                1월 혜택
              </span>
              <span className="rounded-full border border-border bg-secondary px-3 py-1">택 1</span>
              <span className="text-sm font-medium text-foreground/70">월간 케어 참여 80% 이상 하시면!</span>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              <div className="col-span-7 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-card/80 p-4 shadow-sm sm:col-span-4">
                <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-400/50 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-sm">
                    A
                  </span>
                  <span>프리미엄 키튼 사료</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">로얄캐닌 캣 마더 앤 베이비캣 2kg 증정</p>
                <p className="mt-1 text-xs text-muted-foreground">초기 성장 케어용 포뮬러</p>
              </div>
              <div className="col-span-7 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-card/80 p-4 shadow-sm sm:col-span-3">
                <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-400/50 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-sm">
                    B
                  </span>
                  <span>기능성 키튼 사료</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  힐스 사이언스 다이어트 고양이 치킨 레시피 기능성 사료 키튼 1.58kg 증정
                </p>
                <p className="mt-1 text-xs text-muted-foreground">균형 잡힌 성장 지원</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-amber-700 dark:text-amber-300">참여 리워드</span>
            <span>혜택은 케어 참여 기록에 대한 지원이며, 참여 조건 및 재고에 따라 변경될 수 있어요.</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
