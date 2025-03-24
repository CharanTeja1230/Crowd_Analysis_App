"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, FileImage, Upload, Video, X, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { hyderabadLocations } from "@/lib/sensor-types"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (type: "image" | "video" | "live", location?: string) => void
  sensorStatus: "online" | "offline" | "warning"
  currentLocation: string
}

export function UploadModal({ open, onOpenChange, onUploadComplete, sensorStatus, currentLocation }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState("image")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveLocation, setLiveLocation] = useState<string>(currentLocation)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setFiles([])
    setError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(selectedFiles)
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)

      if (activeTab === "image" && droppedFiles.every((file) => file.type.startsWith("image/"))) {
        setFiles(droppedFiles)
        setError(null)
      } else if (activeTab === "video" && droppedFiles.every((file) => file.type.startsWith("video/"))) {
        setFiles(droppedFiles)
        setError(null)
      } else {
        setError(`Please drop only ${activeTab} files`)
      }
    }
  }

  const handleLocationChange = (value: string) => {
    setLiveLocation(value)
  }

  const handleUpload = () => {
    if (files.length === 0 && activeTab !== "live") {
      setError(`Please select a ${activeTab} file to upload`)
      return
    }

    setIsUploading(true)
    setError(null)

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setUploadProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        setIsUploading(false)

        // Generate a unique ID for this upload
        const uploadId = Date.now().toString()

        // Notify parent component about upload completion
        if (onUploadComplete) {
          // For image/video, use current location, for live use selected location
          if (activeTab === "live") {
            onUploadComplete(activeTab as "image" | "video" | "live", liveLocation)
          } else {
            onUploadComplete(activeTab as "image" | "video" | "live", currentLocation)
          }
        }

        onOpenChange(false)

        // Redirect to appropriate page
        if (activeTab === "live") {
          router.push(`/live?location=${encodeURIComponent(liveLocation)}`)
        } else {
          router.push(`/analysis?type=${activeTab}&location=${encodeURIComponent(currentLocation)}&id=${uploadId}`)
        }
      }
    }, 100) // Faster upload for better UX
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const startLiveCapture = () => {
    // Check if sensors are online for live feed
    if (sensorStatus !== "online") {
      setError("Live feed requires sensors to be online. Please ensure your sensors are connected.")
      return
    }

    if (!liveLocation) {
      setError("Please select a location for the live feed")
      return
    }

    // In a real app, this would initiate a live camera feed
    setIsUploading(true)
    setError(null)

    // Simulate connection
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        setIsUploading(false)

        // Notify parent component about upload completion
        if (onUploadComplete) {
          onUploadComplete("live", liveLocation)
        }

        onOpenChange(false)

        // Redirect to live view with location
        router.push(`/live?location=${encodeURIComponent(liveLocation)}`)
      }
    }, 80) // Faster connection for better UX
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>Upload an image, video or connect to a live feed for crowd analysis</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="image" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Live Feed</span>
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Only show location selector for live feed */}
          {activeTab === "live" && (
            <div className="mt-4 space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Select Camera Location
              </label>
              <Select value={liveLocation} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {hyderabadLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <TabsContent value="image" className="py-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      Select Image
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">or drag and drop images here</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Note: Image will be analyzed at your current location ({currentLocation}).
            </p>
          </TabsContent>

          <TabsContent value="video" className="py-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Button type="button" variant="secondary" onClick={() => videoInputRef.current?.click()}>
                      Select Video
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">or drag and drop video here</p>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Note: Video will be analyzed at your current location ({currentLocation}).
            </p>
          </TabsContent>

          <TabsContent value="live" className="py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={startLiveCapture}
                  disabled={sensorStatus !== "online"}
                >
                  Connect Live Feed
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect to a camera or video stream for real-time analysis
              </p>
              {sensorStatus !== "online" && (
                <p className="mt-2 text-xs text-red-500">
                  Live feed requires sensors to be online. Please ensure your sensors are connected.
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Note: Live feed analysis requires active sensors for full environmental data.
            </p>
          </TabsContent>
        </Tabs>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2 w-full" />
            <p className="text-sm text-center text-muted-foreground">
              {activeTab === "live" ? "Connecting..." : "Uploading..."} {uploadProgress}%
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>

          {(activeTab === "image" || activeTab === "video") && (
            <Button type="button" disabled={files.length === 0 || isUploading} onClick={handleUpload} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload & Analyze
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

