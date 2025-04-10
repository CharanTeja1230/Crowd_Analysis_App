"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  Camera,
  Download,
  Pause,
  Play,
  Share2,
  RefreshCw,
  Users,
  AlertCircle,
  CameraOff,
  SwitchCamera,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EnhancedHeatMap } from "@/components/enhanced-heat-map"
import { EnhancedSensorPanel } from "@/components/enhanced-sensor-panel"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSensorStatus, generateMockSensorData } from "@/lib/sensor-types"
import { hyderabadLocations } from "@/lib/sensor-types"
import { detectPeopleInMedia, type CrowdAnalysisResult } from "@/lib/crowd-detection"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

// Key for storing sensor status in localStorage
const SENSOR_STATUS_KEY = "crowd_analysis_sensor_status"

// Demo content URLs - crowd-specific videos for more relevant content
const DEMO_LIVE_FEEDS = ["/demo/crowd-live-1.mp4", "/demo/crowd-live-2.mp4"]

export default function LiveFeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLocation = searchParams.get("location") || hyderabadLocations[0]

  const [location, setLocation] = useState(initialLocation)
  const [isStreaming, setIsStreaming] = useState(true)
  const [sensorStatus, setSensorStatus] = useState<"online" | "offline" | "warning">("offline")
  const [activeTab, setActiveTab] = useState("live")
  const [analysisData, setAnalysisData] = useState<CrowdAnalysisResult | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [autoRetryCount, setAutoRetryCount] = useState(0)
  const maxAutoRetries = 5
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [useFallbackVideo, setUseFallbackVideo] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraAvailable, setIsCameraAvailable] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0)

  // Check if camera is available in the browser
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log("MediaDevices API not supported in this browser")
          setIsCameraAvailable(false)
          return
        }

        // Check if camera is available by requesting permissions
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasCamera = devices.some((device) => device.kind === "videoinput")

        setIsCameraAvailable(hasCamera)

        if (!hasCamera) {
          console.log("No camera detected on this device")
        }
      } catch (err) {
        console.error("Error checking camera availability:", err)
        setIsCameraAvailable(false)
      }
    }

    checkCameraAvailability()
  }, [])

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

  // Load persisted sensor status on component mount
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem(SENSOR_STATUS_KEY)
      if (savedStatus) {
        setSensorStatus(savedStatus as "online" | "offline" | "warning")
      }
    } catch (err) {
      console.error("Error loading sensor status:", err)
    }
  }, [])

  // Update URL when location changes
  useEffect(() => {
    if (!isAuthenticated) return

    const url = new URL(window.location.href)
    url.searchParams.set("location", location)
    router.replace(url.pathname + url.search)
  }, [location, router, isAuthenticated])

  // Access camera when component mounts
  useEffect(() => {
    if (!isAuthenticated || !isCameraAvailable || permissionDenied) return

    const startCamera = async () => {
      try {
        // Stop any existing stream
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop())
        }

        // Request camera access with specified facing mode
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        // Set the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setVideoLoaded(true)
          setVideoError(null)
          setCameraStream(stream)
          setUseFallbackVideo(false)
        }

        toast({
          title: "Camera connected",
          description: "Live feed is now active",
        })
      } catch (err: any) {
        console.error("Error accessing camera:", err)

        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionDenied(true)
          setVideoError("Camera access denied. Please allow camera access in your browser settings.")
          toast({
            title: "Camera access denied",
            description: "Please allow camera access in your browser settings",
            variant: "destructive",
          })
        } else {
          setVideoError(`Could not access camera: ${err.message || "Unknown error"}`)
          // Fall back to demo video
          setUseFallbackVideo(true)
          toast({
            title: "Camera error",
            description: "Falling back to demo video",
            variant: "destructive",
          })
        }
      }
    }

    if (isStreaming) {
      startCamera()
    }

    return () => {
      // Clean up camera stream when component unmounts
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isAuthenticated, isCameraAvailable, facingMode, isStreaming, permissionDenied])

  // Perform crowd analysis on video frames
  useEffect(() => {
    if (!isAuthenticated || !isStreaming || !videoLoaded || sensorStatus !== "online") {
      // Clear any existing analysis data if conditions aren't met
      if (!isStreaming || !videoLoaded || sensorStatus !== "online") {
        setAnalysisData(null)
      }
      return
    }

    // Generate a unique ID for this location and time period
    const analysisId = `live-${location}-${Math.floor(Date.now() / 30000)}`

    // Clear any existing interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }

    // Set up interval for analysis (every 5 seconds)
    analysisIntervalRef.current = setInterval(async () => {
      try {
        // In a real app, we would capture a frame from the video
        // and send it for analysis
        const result = await detectPeopleInMedia(analysisId, "video", analysisId)
        setAnalysisData(result)
      } catch (err) {
        console.error("Error analyzing video frame:", err)
        // Don't set error state here, just log it
      }
    }, 5000)

    // Run initial analysis immediately
    detectPeopleInMedia(analysisId, "video", analysisId)
      .then((result) => setAnalysisData(result))
      .catch((err) => console.error("Error in initial analysis:", err))

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
    }
  }, [isAuthenticated, isStreaming, videoLoaded, location, sensorStatus])

  // Handle fallback video loading if camera access fails
  useEffect(() => {
    if (!isAuthenticated || !useFallbackVideo) return

    const setupFallbackVideo = () => {
      const video = videoRef.current
      if (!video) return

      const handleVideoLoaded = () => {
        setVideoLoaded(true)
        setVideoError(null)
        setAutoRetryCount(0)
      }

      const handleVideoError = () => {
        console.error("Fallback video failed to load:", video.src)

        // Try the next demo video
        setCurrentDemoIndex((prevIndex) => (prevIndex + 1) % DEMO_LIVE_FEEDS.length)

        // Auto-retry logic
        if (autoRetryCount < maxAutoRetries) {
          setIsRetrying(true)

          // Clear any existing timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
          }

          // Set new timeout with exponential backoff
          const backoffTime = Math.min(2000 * Math.pow(2, autoRetryCount), 30000)

          retryTimeoutRef.current = setTimeout(() => {
            setAutoRetryCount((prev) => prev + 1)
            setIsRetrying(false)
          }, backoffTime)
        } else {
          setVideoLoaded(false)
          setVideoError("Failed to load video feed. Please check your connection and try again.")
        }
      }

      video.addEventListener("loadeddata", handleVideoLoaded)
      video.addEventListener("error", handleVideoError)

      // Set the video source for fallback
      video.srcObject = null // Clear any existing camera stream
      video.src = DEMO_LIVE_FEEDS[currentDemoIndex]
      video.loop = true // Loop the demo video

      return () => {
        video.removeEventListener("loadeddata", handleVideoLoaded)
        video.removeEventListener("error", handleVideoError)
      }
    }

    const cleanup = setupFallbackVideo()

    return () => {
      if (cleanup) cleanup()

      // Clear timeout on cleanup
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [isAuthenticated, useFallbackVideo, currentDemoIndex, autoRetryCount])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    // Reset analysis when location changes
    setAnalysisData(null)
  }

  const toggleStream = () => {
    setIsStreaming(!isStreaming)

    // Handle camera stream
    if (cameraStream && !useFallbackVideo) {
      if (isStreaming) {
        // Pause stream by disabling tracks
        cameraStream.getVideoTracks().forEach((track) => {
          track.enabled = false
        })
      } else {
        // Resume stream by enabling tracks
        cameraStream.getVideoTracks().forEach((track) => {
          track.enabled = true
        })
      }
    }
    // Handle fallback video
    else if (videoRef.current && useFallbackVideo) {
      if (isStreaming) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const switchCamera = async () => {
    // Toggle facing mode
    const newFacingMode = facingMode === "user" ? "environment" : "user"
    setFacingMode(newFacingMode)

    // This will trigger the useEffect to restart the camera with the new facing mode
    toast({
      title: "Switching camera",
      description: `Switching to ${newFacingMode === "user" ? "front" : "back"} camera`,
    })
  }

  const handleRetryConnection = () => {
    setIsRetrying(true)
    setVideoError(null)
    setPermissionDenied(false)

    // Try camera first if available
    if (isCameraAvailable) {
      setUseFallbackVideo(false)
      // The camera useEffect will handle reconnection
    } else {
      // Fall back to demo videos
      setCurrentDemoIndex(0)
      setUseFallbackVideo(true)
      setAutoRetryCount(0)
    }

    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    setTimeout(() => {
      setIsRetrying(false)
    }, 1000)
  }

  // Handle sensor status change
  const handleSensorStatusChange = (status: "online" | "offline" | "warning") => {
    setSensorStatus(status)

    // Persist sensor status to localStorage
    try {
      localStorage.setItem(SENSOR_STATUS_KEY, status)
    } catch (err) {
      console.error("Error saving sensor status:", err)
    }
  }

  const handleExport = () => {
    if (!analysisData) return

    // Create CSV data
    const csvData = [
      ["Live Feed Analysis Report", ""],
      ["Location", location],
      ["Timestamp", new Date().toLocaleString()],
      ["Crowd Count", analysisData.crowdCount.toString()],
      ["Status", isStreaming ? "Streaming" : "Paused"],
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Create a blob and download
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `live-feed-${location}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    // Create a shareable link
    const shareUrl = `${window.location.origin}/live?location=${encodeURIComponent(location)}`

    // Copy to clipboard
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Share link copied to clipboard",
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast({
          title: "Copy failed",
          description: "Failed to copy share link. Please try again.",
          variant: "destructive",
        })
      })
  }

  // Get sensor status object
  const sensorStatusObj = getSensorStatus(
    sensorStatus === "online" ? generateMockSensorData(location, true) : undefined,
  )

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
      <Sidebar sensorStatus={sensorStatusObj} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Live Feed</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!analysisData || !isStreaming || !videoLoaded || sensorStatus !== "online"}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-green-500" />
                    <CardTitle>{!useFallbackVideo ? "Live Camera Feed" : "Demo Video Feed"}</CardTitle>
                  </div>
                  <Select value={location} onValueChange={handleLocationChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {hyderabadLocations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>
                  {!useFallbackVideo
                    ? `Live streaming from ${location} (${facingMode === "user" ? "Front" : "Back"} camera)`
                    : `Demo video for ${location}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Video feed container */}
                  <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                    {videoError ? (
                      <motion.div
                        className="text-white text-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                        <p className="text-lg font-bold">Video Feed Error</p>
                        <p className="text-sm">{videoError}</p>
                        <Button
                          variant="outline"
                          className="mt-4 bg-white/10 hover:bg-white/20 text-white"
                          onClick={handleRetryConnection}
                          disabled={isRetrying}
                        >
                          {isRetrying ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Reconnecting...
                            </>
                          ) : (
                            <>Retry Connection</>
                          )}
                        </Button>
                        {permissionDenied && (
                          <Button
                            variant="outline"
                            className="mt-2 bg-white/10 hover:bg-white/20 text-white"
                            onClick={() => {
                              setPermissionDenied(false)
                              setUseFallbackVideo(true)
                            }}
                          >
                            Use Demo Video Instead
                          </Button>
                        )}
                        {autoRetryCount > 0 && (
                          <p className="text-xs mt-2 text-white/70">
                            Auto-retry attempt {autoRetryCount} of {maxAutoRetries}
                            <br />
                            Next retry in {Math.round(Math.min(2 * Math.pow(2, autoRetryCount - 1), 30))} seconds
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover rounded-md"
                        autoPlay
                        playsInline
                        muted
                        loop={useFallbackVideo} // Only loop if using fallback video
                        onLoadedData={() => setVideoLoaded(true)}
                        onError={() => setVideoError("Failed to load video feed")}
                      >
                        {/* No source element needed for camera stream, it uses srcObject */}
                        {useFallbackVideo && <source src={DEMO_LIVE_FEEDS[currentDemoIndex]} type="video/mp4" />}
                        Your browser does not support the video tag.
                      </video>
                    )}

                    {!isStreaming && !videoError && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <p className="text-white text-xl font-bold">Stream Paused</p>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${isStreaming && !videoError ? "bg-red-500 animate-pulse" : "bg-gray-400"}`}
                      ></div>
                      {isStreaming && !videoError ? "LIVE" : "PAUSED"}
                    </div>

                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {location}
                    </div>

                    {analysisData && isStreaming && videoLoaded && sensorStatus === "online" && (
                      <>
                        <motion.div
                          className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          Crowd: {analysisData.crowdCount}
                        </motion.div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex justify-center gap-2">
                    <Button onClick={toggleStream} variant="outline" className="gap-2" disabled={!!videoError}>
                      {isStreaming ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause Stream
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Resume Stream
                        </>
                      )}
                    </Button>

                    {!useFallbackVideo && isCameraAvailable && (
                      <Button
                        onClick={switchCamera}
                        variant="outline"
                        className="gap-2"
                        disabled={!!videoError || !isStreaming}
                      >
                        <SwitchCamera className="h-4 w-4" />
                        Switch Camera
                      </Button>
                    )}

                    {!useFallbackVideo && (
                      <Button
                        onClick={() => {
                          setUseFallbackVideo(true)
                          // Stop camera stream
                          if (cameraStream) {
                            cameraStream.getTracks().forEach((track) => track.stop())
                            setCameraStream(null)
                          }
                        }}
                        variant="outline"
                        className="gap-2"
                        disabled={!!videoError}
                      >
                        <CameraOff className="h-4 w-4" />
                        Use Demo Video
                      </Button>
                    )}

                    {useFallbackVideo && isCameraAvailable && (
                      <Button
                        onClick={() => {
                          setUseFallbackVideo(false)
                          setPermissionDenied(false)
                          // The camera useEffect will handle reconnection
                        }}
                        variant="outline"
                        className="gap-2"
                        disabled={!!videoError || permissionDenied}
                      >
                        <Camera className="h-4 w-4" />
                        Use Camera
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <EnhancedSensorPanel
              location={location}
              sensorStatus={sensorStatus}
              onSensorStatusChange={handleSensorStatusChange}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <EnhancedHeatMap
            location={location}
            sensorStatus={sensorStatus}
            mediaSource="live"
            analysisData={
              analysisData
                ? {
                    hotspots: analysisData.hotspots,
                    crowdCount: analysisData.crowdCount,
                  }
                : undefined
            }
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Live Metrics</CardTitle>
              <CardDescription>Real-time crowd analytics at {location}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="crowd" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="crowd" className="flex-1">
                    Crowd
                  </TabsTrigger>
                  <TabsTrigger value="density" className="flex-1">
                    Density
                  </TabsTrigger>
                  <TabsTrigger value="anomalies" className="flex-1">
                    Anomalies
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="crowd" className="mt-4">
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    {!isStreaming || !videoLoaded || sensorStatus !== "online" ? (
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-amber-500" />
                        <p className="text-lg font-medium">No Live Data Available</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {!isStreaming
                            ? "Stream is paused"
                            : !videoLoaded
                              ? "Video feed not connected"
                              : "Sensors are offline"}
                        </p>
                      </div>
                    ) : (
                      <>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="text-7xl font-bold mb-4">{analysisData?.crowdCount || "—"}</div>
                        </motion.div>
                        <motion.p
                          className="text-xl"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          People Detected
                        </motion.p>
                        <motion.p
                          className="text-muted-foreground mt-2"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          Live count at {location}
                        </motion.p>
                        <motion.div
                          className="flex items-center gap-2 mt-4"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <Users className="h-5 w-5 text-primary" />
                          <span className="text-sm">Updated {new Date().toLocaleTimeString()}</span>
                        </motion.div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="density" className="mt-4">
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    {!isStreaming || !videoLoaded || sensorStatus !== "online" ? (
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-amber-500" />
                        <p className="text-lg font-medium">No Live Data Available</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {!isStreaming
                            ? "Stream is paused"
                            : !videoLoaded
                              ? "Video feed not connected"
                              : "Sensors are offline"}
                        </p>
                      </div>
                    ) : (
                      <>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className={`text-7xl font-bold mb-4 ${
                            analysisData && analysisData.crowdCount > 70
                              ? "text-red-500"
                              : analysisData && analysisData.crowdCount > 40
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {analysisData ? Math.min(Math.floor(analysisData.crowdCount / 2), 100) : "—"}%
                        </motion.div>
                        <motion.p
                          className="text-xl"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          Crowd Density
                        </motion.p>
                        <motion.p
                          className="text-muted-foreground mt-2"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          Live density at {location}
                        </motion.p>

                        {analysisData && analysisData.crowdCount > 70 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="mt-4"
                          >
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                High crowd density detected! Consider implementing crowd control measures.
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="anomalies" className="mt-4">
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    {!isStreaming || !videoLoaded || sensorStatus !== "online" ? (
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-amber-500" />
                        <p className="text-lg font-medium">No Live Data Available</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {!isStreaming
                            ? "Stream is paused"
                            : !videoLoaded
                              ? "Video feed not connected"
                              : "Sensors are offline"}
                        </p>
                      </div>
                    ) : analysisData && analysisData.anomalies && analysisData.anomalies.length > 0 ? (
                      <div className="space-y-4 overflow-auto max-h-[300px] w-full">
                        {analysisData.anomalies.map((anomaly, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          >
                            <Alert variant="destructive" className="mb-4">
                              <AlertDescription>
                                <div className="font-medium mb-1">
                                  {anomaly.type === "crowd_surge"
                                    ? "High crowd density detected!"
                                    : "Anomaly detected!"}
                                </div>
                                <div className="text-sm">
                                  <div>Confidence: {(anomaly.confidence * 100).toFixed(1)}%</div>
                                  <div>Location: {anomaly.location}</div>
                                  <div>Time: {new Date(anomaly.timestamp).toLocaleTimeString()}</div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                      >
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No anomalies detected</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            // Simulate an anomaly for testing
                            if (analysisData) {
                              const newAnomalies = [...(analysisData.anomalies || [])]
                              newAnomalies.push({
                                type: "crowd_surge",
                                confidence: 0.85,
                                location: location,
                                timestamp: new Date().toISOString(),
                              })

                              setAnalysisData({
                                ...analysisData,
                                anomalies: newAnomalies,
                              })
                            }
                          }}
                        >
                          Simulate Anomaly
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
