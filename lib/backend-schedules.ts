"use client"

import type { CalendarEvent } from "./types"

const STORAGE_KEY = "okat_calendar_schedules"

/**
 * 모든 일정 조회
 */
export async function fetchSchedules(catId: string): Promise<CalendarEvent[]> {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const allEvents: CalendarEvent[] = JSON.parse(stored)
    return allEvents.filter(event => event.catId === catId)
  } catch (error) {
    console.error("Failed to fetch schedules:", error)
    return []
  }
}

/**
 * 일정 저장 (생성/수정)
 */
export async function saveSchedule(event: CalendarEvent): Promise<CalendarEvent> {
  if (typeof window === "undefined") return event
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    let allEvents: CalendarEvent[] = stored ? JSON.parse(stored) : []
    
    const index = allEvents.findIndex(e => e.id === event.id)
    if (index >= 0) {
      allEvents[index] = event
    } else {
      allEvents.push(event)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents))
    return event
  } catch (error) {
    console.error("Failed to save schedule:", error)
    throw error
  }
}

/**
 * 일정 삭제
 */
export async function deleteSchedule(id: string): Promise<boolean> {
  if (typeof window === "undefined") return false
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return false
    
    let allEvents: CalendarEvent[] = JSON.parse(stored)
    const newEvents = allEvents.filter(e => e.id !== id)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents))
    return true
  } catch (error) {
    console.error("Failed to delete schedule:", error)
    return false
  }
}

/**
 * 특정 날짜의 일정 조회
 */
export async function fetchSchedulesByDate(catId: string, date: string): Promise<CalendarEvent[]> {
  const events = await fetchSchedules(catId)
  return events.filter(e => e.date === date)
}
