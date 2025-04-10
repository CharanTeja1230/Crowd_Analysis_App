"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadModal } from "@/components/upload-modal"

export default function UploadPage() {
  const router = useRouter()
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  const handleMediaUpload = (type: "image" | "video" | "live", location?: string) => {
    setShowUploadModal(false)

    // For live feed, redirect to live page
    if (type === "live") {
      router.push(`/live?location=${encodeURIComponent(location || "Uppal")}`)
    } else {
      // For image/video, redirect to analysis page
      router.push(`/analysis?type=${type}&location=${encodeURIComponent(location || "Uppal")}`)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold">Upload Media</h1>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5 text-primary" />
              <CardTitle>Upload Media</CardTitle>
            </div>
            <CardDescription>Upload images, videos, or connect to live feeds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Upload media for crowd analysis</p>
              <Button onClick={() => setShowUploadModal(true)}>
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
            </div>
          </CardContent>
        </Card>

        <UploadModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onUploadComplete={handleMediaUpload}
          sensorStatus="online"
          currentLocation="Uppal"
        />
      </div>
    </div>
  )
}
