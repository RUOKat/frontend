"use client";
import { useState } from "react";

export default function WebcamPage() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
        <h1 className="text-2xl font-bold text-primary">Webcam Page</h1>
      </header>

      {/* 웹캠 영역 */}
      <main className="flex flex-col items-center justify-center mt-10">
        <div className="w-96 h-72 bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
          {isRecording ? (
            <span className="text-red-500 font-semibold">Recording...</span>
          ) : (
            <span className="text-gray-500">Webcam Feed</span>
          )}
        </div>
      </main>
    </div>
  );
}
