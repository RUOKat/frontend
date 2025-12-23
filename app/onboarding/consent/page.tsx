import Link from "next/link"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ConsentNoticePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 px-6 pt-safe-top">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">질문 전에 알려드릴게요</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pb-24">
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0">
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              앞으로 입력하시는 정보는 고양이의 평소 상태를 이해하고 변화가 있을 때 알려드리기 위해 사용됩니다.
            </div>
          </CardContent>
        </Card>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <Button asChild className="w-full h-12" size="lg">
          <Link href="/onboarding/questions">계속</Link>
        </Button>
      </div>
    </div>
  )
}
