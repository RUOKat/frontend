"use client"
import { useState } from "react"

export default function WebcamPage() {
  const [isRecording, setIsRecording] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
       \
