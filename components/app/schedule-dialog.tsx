"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"


import { 
  Bell, 
  Trash2, 
  Plus, 
  Calendar as CalendarIcon
} from "lucide-react"
import { type CalendarEvent, type EventType } from "@/lib/types"
import { saveSchedule, deleteSchedule } from "@/lib/backend-schedules"

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string // YYYY-MM-DD
  catId: string
  events: CalendarEvent[]
  onUpdate: () => void
}


export function ScheduleDialog({ open, onOpenChange, date, catId, events, onUpdate }: ScheduleDialogProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [titles, setTitles] = useState<string[]>([""])
  const [isNotify, setIsNotify] = useState(true)


  const [isLoading, setIsLoading] = useState(false)

  const handleAdd = async () => {
    const validTitles = titles.map(t => t.trim()).filter(t => t)
    if (validTitles.length === 0 || !catId) return

    setIsLoading(true)
    try {
      for (const t of validTitles) {
        const newEvent: CalendarEvent = {
          id: crypto.randomUUID(),
          catId,
          title: t,
          date,
          type: "other",
          isNotificationEnabled: isNotify,
          createdAt: new Date().toISOString(),
        }
        await saveSchedule(newEvent)
      }
      
      setTitles([""])
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      console.error("Failed to add schedule:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) return
    
    try {
      await deleteSchedule(id)
      onUpdate()
    } catch (error) {
      console.error("Failed to delete schedule:", error)
    }
  }

  const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <span>{formattedDate} 일정</span>
            </DialogTitle>
            {isAdding && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-sm font-medium text-foreground">알림 받기</span>
                <Switch checked={isNotify} onCheckedChange={setIsNotify} className="scale-75 origin-right" />
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {events.length === 0 && !isAdding && (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
              <p className="text-sm">기록된 일정이 없습니다.</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-primary"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                새 일정 추가하기
              </Button>
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-2">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center p-1">
                      <Checkbox 
                        checked={event.isCompleted || false} 
                        onCheckedChange={async (checked) => {
                          try {
                            const updatedEvent = { ...event, isCompleted: checked === true }
                            await saveSchedule(updatedEvent)
                            onUpdate() 
                          } catch (error) {
                            console.error("Failed to update status", error)
                          }
                        }}
                        className="h-5 w-5 rounded border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground transition-all focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-colors ${event.isCompleted ? "text-muted-foreground/60 line-through" : "text-foreground"}`}>{event.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.isNotificationEnabled && (
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAdding && (
            <div className="space-y-4 border rounded-xl p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">할 일</Label>
                <div className="space-y-2">
                  {titles.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <Input 
                        placeholder={i === 0 ? "고양이의 일정을 기록해주세요!" : ""}
                        value={t}
                        onChange={(e) => {
                          const newTitles = [...titles]
                          newTitles[i] = e.target.value
                          setTitles(newTitles)
                        }}
                        autoFocus={i === titles.length - 1}
                      />
                      {titles.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            const newTitles = titles.filter((_, idx) => idx !== i)
                            setTitles(newTitles)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed text-muted-foreground h-9"
                  onClick={() => setTitles([...titles, ""])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  항목 추가
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handleAdd} 
                  disabled={!titles.some(t => t.trim()) || isLoading}
                >
                  {isLoading ? "저장 중..." : "저장하기"}
                </Button>
                <Button 
                  variant="outline" 
                   className="flex-1"
                  onClick={() => {
                    setTitles([""])
                    setIsAdding(false)
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isAdding && events.length > 0 && (
          <DialogFooter>
            <Button className="w-full" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-1" />
              일정 추가
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
