"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Camera, Download, Pause, Play, Share2 } from "lucide-react"

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

export default function LiveFeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLocation = searchParams.get("location") || hyderabadLocations[0]

  const [location, setLocation] = useState(initialLocation)
  const [isStreaming, setIsStreaming] = useState(true)
  const [sensorStatus, setSensorStatus] = useState<"online" | "offline" | "warning">("online")
  const [activeTab, setActiveTab] = useState("live")
  const [crowdCount, setCrowdCount] = useState(0)
  const [density, setDensity] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // Update URL when location changes
  useEffect(() => {
    if (!isAuthenticated) return

    const url = new URL(window.location.href)
    url.searchParams.set("location", location)
    router.replace(url.pathname + url.search)
  }, [location, router, isAuthenticated])

  // Simulate video feed and update metrics
  useEffect(() => {
    if (!isAuthenticated || !isStreaming) return

    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      setCrowdCount(Math.floor(Math.random() * 200 + 50))
      setDensity(Math.floor(Math.random() * 80 + 20))
    }, 2000)

    return () => clearInterval(interval)
  }, [isStreaming, isAuthenticated])

  const handleLocationChange = (value: string) => {
    setLocation(value)
  }

  const toggleStream = () => {
    setIsStreaming(!isStreaming)

    // Pause/play video if available
    if (videoRef.current) {
      if (isStreaming) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ["Live Feed Analysis Report", ""],
      ["Location", location],
      ["Timestamp", new Date().toLocaleString()],
      ["Crowd Count", crowdCount.toString()],
      ["Density", `${density}%`],
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
        alert("Share link copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        alert("Failed to copy share link. Please try again.")
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
            <Button variant="outline" onClick={handleExport}>
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
                    <CardTitle>Live Camera Feed</CardTitle>
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
                <CardDescription>Live streaming from {location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Mock video feed - in a real app, this would be a real video stream */}
                  <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay muted loop>
                      <source src="/placeholder-video.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {!isStreaming && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <p className="text-white text-xl font-bold">Stream Paused</p>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${isStreaming ? "bg-red-500 animate-pulse" : "bg-gray-400"}`}
                      ></div>
                      {isStreaming ? "LIVE" : "PAUSED"}
                    </div>

                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {location}
                    </div>

                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      Crowd: {crowdCount}
                    </div>

                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      Density: {density}%
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <Button onClick={toggleStream} variant="outline" className="gap-2">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <EnhancedSensorPanel
              location={location}
              sensorStatus={sensorStatus}
              onSensorStatusChange={setSensorStatus}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <EnhancedHeatMap location={location} sensorStatus={sensorStatus} mediaSource="live" />

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
                    <div className="text-7xl font-bold mb-4">{crowdCount}</div>
                    <p className="text-xl">People Detected</p>
                    <p className="text-muted-foreground mt-2">Live count at {location}</p>
                  </div>
                </TabsContent>

                <TabsContent value="density" className="mt-4">
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="text-7xl font-bold mb-4">{density}%</div>
                    <p className="text-xl">Crowd Density</p>
                    <p className="text-muted-foreground mt-2">Live density at {location}</p>
                  </div>
                </TabsContent>

                <TabsContent value="anomalies" className="mt-4">
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    {density > 75 ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>High crowd density detected! Potential safety risk.</AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-muted-foreground">No anomalies detected</p>
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

