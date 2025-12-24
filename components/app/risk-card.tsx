import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import type { RiskStatus } from "@/lib/types"
import { AlertCircle, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface RiskCardProps {
  riskStatus: RiskStatus
  catName?: string
}

export function RiskCard({ riskStatus, catName = "고양이" }: RiskCardProps) {
  const Icon =
    riskStatus.level === "normal" ? CheckCircle2 : riskStatus.level === "caution" ? AlertTriangle : AlertCircle

  const iconColorClass =
    riskStatus.level === "normal"
      ? "text-emerald-500"
      : riskStatus.level === "caution"
        ? "text-amber-500"
        : "text-rose-500"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColorClass}`} />
            이상 신호
          </CardTitle>
          <StatusBadge level={riskStatus.level} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{riskStatus.summary}</p>

        <p className="text-xs text-muted-foreground/80 italic">* 판단이 아닌 참고용이에요.</p>

        <div className="pt-2">
          <Button
            asChild
            variant={riskStatus.level === "normal" ? "default" : "outline"}
            className={riskStatus.level === "normal" ? "w-full" : "w-full bg-transparent"}
            size="sm"
          >
            <Link href="/monitoring">
              {riskStatus.level === "normal" ? "모니터링 보기" : "왜 이렇게 판단했나요?"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
