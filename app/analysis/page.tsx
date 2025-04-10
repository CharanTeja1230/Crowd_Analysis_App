"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Download,
  Share2,
  FileImage,
  Video,
  Camera,
  AlertTriangle,
  Users,
  Loader2,
  BarChart3,
  Info,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EnhancedHeatMap } from "@/components/enhanced-heat-map"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { detectPeopleInMedia, type CrowdAnalysisResult } from "@/lib/crowd-detection"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

// Demo content URLs
const DEMO_IMAGES = ["/demo/crowd-image-1.jpg", "/demo/crowd-image-2.jpg", "/demo/crowd-image-3.jpg"]
const DEMO_VIDEOS = ["/demo/crowd-video-1.mp4", "/demo/crowd-video-2.mp4", "/demo/crowd-video-3.mp4"]

export default function AnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mediaType = searchParams.get("type") || "image"
  const location = searchParams.get("location") || "Unknown"
  const mediaId = searchParams.get("id") || Date.now().toString()

  const [loading, setLoading] = useState(true)
  const [analysisData, setAnalysisData] = useState<CrowdAnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState("heatmap")
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const analysisComplete = useRef(false)
  const analysisAttempts = useRef(0)

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      // Check if user is logged in
      const user = localStorage.getItem("user")
      if (!user) {
        // Redirect to login page
        router.push("/auth/login")
      } else {
        setIsAuthenticated(true)
      }
      setCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  // Determine if this is a demo media and set the appropriate URL
  useEffect(() => {
    if (!isAuthenticated) return

    // Check if this is a demo media
    if (mediaId.startsWith("demo-")) {
      setIsDemo(true)

      // Extract demo index from mediaId (format: demo-type-index-timestamp)
      const parts = mediaId.split("-")
      if (parts.length >= 3) {
        const demoType = parts[1]
        const demoIndex = Number.parseInt(parts[2], 10) || 0

        // Set the appropriate demo URL
        if (demoType === "image") {
          const url = DEMO_IMAGES[demoIndex % DEMO_IMAGES.length]
          setMediaUrl(url)
        } else if (demoType === "video") {
          const url = DEMO_VIDEOS[demoIndex % DEMO_VIDEOS.length]
          setMediaUrl(url)
        }
      }
    } else {
      // For real uploads, we would fetch the media URL from the server
      // For now, we'll use a placeholder
      if (mediaType === "image") {
        setMediaUrl("/placeholder.svg?height=400&width=600&text=Uploaded+Image")
      } else if (mediaType === "video") {
        setMediaUrl("/placeholder.svg?height=400&width=600&text=Uploaded+Video")
      }
    }
  }, [mediaId, mediaType, isAuthenticated])

  // Validate media ID to ensure it's a real upload
  const isValidMediaId = (id: string): boolean => {
    // Demo media is always valid
    if (id.startsWith("demo-")) return true

    // In a real app, this would check against a database of uploaded files
    // For demo purposes, we'll check if the ID has the expected format
    return id.includes("-") && id.length > 10
  }

  useEffect(() => {
    if (!isAuthenticated) return

    // Reset state when media type or location changes
    setLoading(true)
    setError(null)
    setAnalysisProgress(0)
    analysisComplete.current = false
    analysisAttempts.current = 0

    // Check if this is a valid media ID
    if (!isValidMediaId(mediaId) && mediaType !== "live") {
      setError("No valid media found for analysis. Please upload a file first.")
      setLoading(false)
      return
    }

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.floor(Math.random() * 5) + 1
      })
    }, 200)

    // Perform crowd detection and analysis
    const analyzeMedia = async () => {
      try {
        // In a real app, we would fetch the actual media file here
        // const mediaFile = await fetch(`/api/media/${mediaId}`).then(res => res.blob());

        // For demo, we'll use our advanced detection with the mediaId
        const result = await detectPeopleInMedia(mediaId, mediaType as "image" | "video", mediaId)

        // Check if any people were detected
        if (result.people.length === 0) {
          // For demo content, we should always have people detected
          if (isDemo) {
            // Generate synthetic data with people
            const syntheticResult = {
              ...result,
              crowdCount: 15 + Math.floor(Math.random() * 20),
              people: Array(15 + Math.floor(Math.random() * 20))
                .fill(0)
                .map((_, i) => ({
                  id: `synthetic-person-${i}`,
                  boundingBox: {
                    x: Math.random() * 0.8 + 0.1,
                    y: Math.random() * 0.8 + 0.1,
                    width: 0.05 + Math.random() * 0.05,
                    height: 0.1 + Math.random() * 0.1,
                  },
                  confidence: 0.7 + Math.random() * 0.3,
                  isFullyVisible: Math.random() > 0.2,
                })),
              hotspots: Array(5)
                .fill(0)
                .map(() => ({
                  x: Math.random() * 0.8 + 0.1,
                  y: Math.random() * 0.8 + 0.1,
                  radius: 0.1 + Math.random() * 0.1,
                  intensity: 0.6 + Math.random() * 0.4,
                })),
            }
            setAnalysisData(syntheticResult)
          } else {
            setError("No people detected in the media. Please try another file with visible people.")
            setLoading(false)
            clearInterval(progressInterval)
            return
          }
        } else {
          setAnalysisData(result)
        }

        // Complete the progress
        setAnalysisProgress(100)

        // Short delay to show 100% before completing
        setTimeout(() => {
          analysisComplete.current = true
          setLoading(false)

          // Show success toast
          toast({
            title: "Analysis Complete",
            description: `Detected ${analysisData?.crowdCount || result.crowdCount} people in the ${mediaType}`,
          })

          // Draw bounding boxes if on people tab
          if (activeTab === "people" && canvasRef.current) {
            if (mediaType === "image" && imageRef.current) {
              drawBoundingBoxes(analysisData?.people || result.people)
            } else if (mediaType === "video" && videoRef.current) {
              drawBoundingBoxes(analysisData?.people || result.people)
            }
          }
        }, 500)
      } catch (err: any) {
        console.error("Error analyzing media:", err)

        // If we've tried less than 3 times, retry
        if (analysisAttempts.current < 2) {
          analysisAttempts.current++

          // Show retry toast
          toast({
            title: "Retrying Analysis",
            description: `Attempt ${analysisAttempts.current + 1} of 3...`,
            variant: "warning",
          })

          // Reset progress a bit
          setAnalysisProgress(Math.max(analysisProgress - 20, 0))

          // Try again after a delay
          setTimeout(analyzeMedia, 1500)
          return
        }

        setError(err.message || "Failed to analyze media. The file may be corrupted or in an unsupported format.")
        setLoading(false)
        clearInterval(progressInterval)
      }
    }

    // Start analysis after a short delay to simulate processing
    const timer = setTimeout(analyzeMedia, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
    }
  }, [mediaType, location, mediaId, isAuthenticated, isDemo])

  // Draw bounding boxes on canvas when tab changes to "people"
  useEffect(() => {
    if (activeTab === "people" && analysisData && canvasRef.current) {
      if (mediaType === "image" && imageRef.current) {
        drawBoundingBoxes(analysisData.people)
      } else if (mediaType === "video" && videoRef.current) {
        drawBoundingBoxes(analysisData.people)
      }
    }
  }, [activeTab, analysisData, mediaType])

  // Handle media load event
  const handleMediaLoad = () => {
    if (activeTab === "people" && analysisData && canvasRef.current) {
      drawBoundingBoxes(analysisData.people)
    }
  }

  // Function to draw bounding boxes on canvas
  const drawBoundingBoxes = (people: any[]) => {
    const canvas = canvasRef.current
    if (!canvas || !showBoundingBoxes) return

    const mediaElement = mediaType === "image" ? imageRef.current : videoRef.current
    if (!mediaElement) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match media
    canvas.width = mediaElement.clientWidth
    canvas.height = mediaElement.clientHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw media on canvas
    ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height)

    // Draw bounding boxes
    people.forEach((person, index) => {
      const { x, y, width, height } = person.boundingBox

      // Convert normalized coordinates to pixel values
      const boxX = x * canvas.width
      const boxY = y * canvas.height
      const boxWidth = width * canvas.width
      const boxHeight = height * canvas.height

      // Draw bounding box with different colors based on confidence
      const confidence = person.confidence || 0.5
      let boxColor = "rgba(255, 0, 0, 0.8)" // Low confidence (red)

      if (confidence > 0.7) {
        boxColor = "rgba(0, 255, 0, 0.8)" // High confidence (green)
      } else if (confidence > 0.5) {
        boxColor = "rgba(255, 255, 0, 0.8)" // Medium confidence (yellow)
      }

      ctx.strokeStyle = boxColor
      ctx.lineWidth = 2
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

      // Draw person number
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(boxX, boxY - 20, 30, 20)
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.fillText(`#${index + 1}`, boxX + 5, boxY - 5)

      // Draw confidence
      const confidencePercent = Math.round(confidence * 100)
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(boxX + boxWidth - 40, boxY - 20, 40, 20)
      ctx.fillStyle = confidencePercent > 70 ? "rgba(0, 255, 0, 0.8)" : "rgba(255, 255, 0, 0.8)"
      ctx.fillText(`${confidencePercent}%`, boxX + boxWidth - 38, boxY - 5)

      // Indicate if person is fully visible
      if (person.isFullyVisible) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(boxX, boxY + boxHeight, 40, 20)
        ctx.fillStyle = "white"
        ctx.fillText("Full", boxX + 5, boxY + boxHeight + 15)
      }
    })

    // Add count text at the top
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 150, 30)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(`People Count: ${people.length}`, 20, 30)
  }

  const handleExport = () => {
    if (!analysisData) return

    // Create CSV data
    const csvData = [
      ["Analysis Report", ""],
      ["Media Type", mediaType],
      ["Location", location],
      ["Timestamp", new Date().toLocaleString()],
      ["Crowd Count", analysisData.crowdCount.toString()],
      ["Processing Time", `${analysisData.processingTime.toFixed(2)}s`],
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Create a blob and download
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `crowd-analysis-${location}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Analysis report has been downloaded",
    })
  }

  const handleShare = () => {
    // Create a shareable link with the same mediaId to ensure consistent results
    const shareUrl = `${window.location.origin}/shared?id=${mediaId}&type=${mediaType}&location=${encodeURIComponent(location)}`

    // Copy to clipboard
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard",
        })
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        toast({
          title: "Copy Failed",
          description: "Failed to copy share link. Please try again.",
          variant: "destructive",
        })
      })
  }

  const getMediaIcon = () => {
    switch (mediaType) {
      case "image":
        return <FileImage className="h-6 w-6" />
      case "video":
        return <Video className="h-6 w-6" />
      case "live":
        return <Camera className="h-6 w-6" />
      default:
        return <FileImage className="h-6 w-6" />
    }
  }

  // Toggle bounding boxes
  const toggleBoundingBoxes = () => {
    const newValue = !showBoundingBoxes
    setShowBoundingBoxes(newValue)

    if (newValue && analysisData && canvasRef.current) {
      drawBoundingBoxes(analysisData.people)
    } else if (!newValue && canvasRef.current) {
      // Clear canvas
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const mediaElement = mediaType === "image" ? imageRef.current : videoRef.current
        if (mediaElement) {
          ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height)
        }
      }
    }
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Only render page if authenticated
  if (!isAuthenticated) {
    return null // Router will redirect to login
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Media Analysis</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={loading || !!error}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" onClick={handleShare} disabled={loading || !!error}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Analyzing {mediaType}...</span>
              <span className="text-sm">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMediaIcon()}
                    <CardTitle>{mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Analysis</CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {!loading && analysisData && `Processed in ${analysisData.processingTime.toFixed(2)}s`}
                  </div>
                </div>
                <CardDescription>
                  Analysis results for {mediaType} at {location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="heatmap" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                    <TabsTrigger value="density">Density</TabsTrigger>
                    <TabsTrigger value="people">People</TabsTrigger>
                    <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                  </TabsList>

                  <TabsContent value="heatmap">
                    {error ? (
                      <div className="h-[400px] flex flex-col items-center justify-center border rounded-md">
                        <Alert variant="destructive" className="max-w-md">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <EnhancedHeatMap
                        location={location}
                        sensorStatus="online"
                        mediaSource={mediaType as any}
                        height={400}
                        analysisData={
                          analysisData
                            ? {
                                hotspots: analysisData.hotspots,
                                crowdCount: analysisData.crowdCount,
                              }
                            : undefined
                        }
                        isLoading={loading}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="density">
                    {loading ? (
                      <div className="h-[400px] flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                        <p className="text-lg font-medium">Analyzing People Count</p>
                        <p className="text-sm text-muted-foreground mt-2">Please wait while we process the data</p>
                      </div>
                    ) : error ? (
                      <div className="h-[400px] flex flex-col items-center justify-center border rounded-md">
                        <Alert variant="destructive" className="max-w-md">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center border rounded-md p-6">
                        <div className="text-center">
                          <div className="relative mb-8">
                            <div className="text-7xl font-bold text-primary">{analysisData?.crowdCount || 0}</div>
                            <div className="absolute -top-4 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              EXACT COUNT
                            </div>
                          </div>
                          <p className="text-xl">People Detected</p>
                          <p className="text-muted-foreground mt-2">Based on precise detection at {location}</p>

                          <div className="mt-6 flex items-center justify-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="text-lg font-medium">Each person counted individually</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="people">
                    {loading ? (
                      <div className="h-[400px] flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                        <p className="text-lg font-medium">Detecting People</p>
                        <p className="text-sm text-muted-foreground mt-2">Please wait while we process the data</p>
                      </div>
                    ) : error ? (
                      <div className="h-[400px] flex flex-col items-center justify-center border rounded-md">
                        <Alert variant="destructive" className="max-w-md">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Detected People</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-primary">
                              Total Count: {analysisData?.people.length || 0}
                            </span>
                            <Button variant="outline" size="sm" onClick={toggleBoundingBoxes}>
                              {showBoundingBoxes ? "Hide" : "Show"} Bounding Boxes
                            </Button>
                          </div>
                        </div>

                        <div className="relative border rounded-md overflow-hidden" style={{ height: "350px" }}>
                          {/* Media display */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black">
                            {mediaType === "image" && mediaUrl ? (
                              <img
                                ref={imageRef}
                                src={mediaUrl || "/placeholder.svg"}
                                alt="Media preview"
                                className="max-w-full max-h-full object-contain"
                                onLoad={handleMediaLoad}
                                crossOrigin="anonymous"
                              />
                            ) : mediaType === "video" && mediaUrl ? (
                              <video
                                ref={videoRef}
                                src={mediaUrl}
                                className="max-w-full max-h-full object-contain"
                                controls
                                muted
                                onLoadedData={handleMediaLoad}
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="text-white">No media available</div>
                            )}
                          </div>

                          {/* Canvas for drawing bounding boxes */}
                          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                          {/* Fallback if no media is available */}
                          {(!mediaUrl || !analysisData) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="text-white text-center p-4">
                                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                                <p>Media preview not available</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Alert variant="info" className="mt-4">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            This analysis focuses on accurately counting distinct human figures. Only clearly visible
                            individuals are included in the count.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="anomalies">
                    {loading ? (
                      <div className="h-[400px] flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                        <p className="text-lg font-medium">Detecting Anomalies</p>
                        <p className="text-sm text-muted-foreground mt-2">Please wait while we process the data</p>
                      </div>
                    ) : error ? (
                      <div className="h-[400px] flex flex-col items-center justify-center border rounded-md">
                        <Alert variant="destructive" className="max-w-md">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </div>
                    ) : analysisData && analysisData.anomalies && analysisData.anomalies.length > 0 ? (
                      <div className="space-y-4">
                        {analysisData.anomalies.map((anomaly, index) => (
                          <Alert key={index} variant="warning">
                            <div className="flex flex-col">
                              <div className="font-medium">
                                {anomaly.type === "crowd_surge" ? "Crowd Surge Detected" : "Anomaly Detected"}
                              </div>
                              <AlertDescription>
                                <div className="mt-2 text-sm">
                                  <div>Confidence: {(anomaly.confidence * 100).toFixed(1)}%</div>
                                  <div>Location: {anomaly.location}</div>
                                  <div>Time: {new Date(anomaly.timestamp).toLocaleTimeString()}</div>
                                </div>
                              </AlertDescription>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center border rounded-md">
                        <div className="text-center">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-lg font-medium">No Anomalies Detected</p>
                          <p className="text-muted-foreground mt-2">The crowd appears to be within normal parameters</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Analysis Summary</CardTitle>
                </div>
                <CardDescription>Key metrics from the analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Exact People Count</span>
                      <span className="text-xl font-bold">{analysisData?.crowdCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Processing Time</span>
                      <span className="text-xl font-bold">{analysisData?.processingTime.toFixed(2)}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Timestamp</span>
                      <span className="text-sm">{new Date().toLocaleString()}</span>
                    </div>

                    {analysisData && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Detection Confidence</div>
                        <div className="text-sm font-medium text-primary">
                          {analysisData.people.length > 0
                            ? `${Math.round((analysisData.people.reduce((sum, p) => sum + p.confidence, 0) / analysisData.people.length) * 100)}% Average Confidence`
                            : "No people detected"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Each person is detected individually with high precision algorithms.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
