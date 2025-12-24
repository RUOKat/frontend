"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/app/status-badge"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { getCategoryName } from "@/lib/triage"
import { Activity, AlertCircle, CheckCircle2, AlertTriangle, FileText, Lightbulb } from "lucide-react"

export default function MonitoringPage() {
  const { activeCat } = useActiveCat()
  const { riskStatus, followUpPlan, followUpAnswers } = useOnboarding()

  const Icon =
    riskStatus?.level === "normal" ? CheckCircle2 : riskStatus?.level === "caution" ? AlertTriangle : AlertCircle

  const iconColorClass =
    riskStatus?.level === "normal"
      ? "text-emerald-500"
      : riskStatus?.level === "caution"
        ? "text-amber-500"
        : "text-rose-500"

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
        <div className="py-6">
          <h1 className="text-xl font-bold text-foreground">모니터링</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCat?.name || "고양이"}의 건강 상태를 확인해요</p>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 pb-6 space-y-4">
        {/* 현재 관찰 레벨 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                현재 관찰 레벨
              </CardTitle>
              {riskStatus && <StatusBadge level={riskStatus.level} size="sm" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskStatus ? (
              <>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorClass}`} />
                  <p className="text-sm text-foreground">{riskStatus.summary}</p>
                </div>

                <p className="text-xs text-muted-foreground italic">* 진단이 아닌 참고용입니다.</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">분석 결과가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 권장 사항 */}
        {riskStatus && riskStatus.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                권장 사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {riskStatus.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 판단 근거 */}
        {followUpPlan && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                판단 근거
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">관찰 영역</p>
                <p className="text-sm font-medium">{getCategoryName(followUpPlan.category)}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">주요 신호</p>
                <p className="text-sm">{followUpPlan.reasonSummary}</p>
              </div>

              {followUpAnswers && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">추가 질문 답변</p>
                  <div className="space-y-2">
                    {followUpPlan.questions.map((q, index) => {
                      const answer = followUpAnswers[q.id]
                      const option = q.options.find((o) => o.value === answer)
                      return (
                        <div key={q.id} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">{index + 1}.</span>
                          <div>
                            <p className="text-muted-foreground">{q.text}</p>
                            <p className="font-medium text-foreground mt-0.5">{option?.label || answer}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 안내 */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            이 정보는 의료적 진단이 아니며, 수의사 상담을 대체하지 않습니다.
            <br />
            걱정되는 증상이 있다면 반드시 수의사와 상담하세요.
          </p>
        </div>
      </main>
    </div>
  )
}
