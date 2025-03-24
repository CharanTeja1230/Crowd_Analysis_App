"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Download, Share2, FileImage, Video, Camera, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EnhancedHeatMap } from "@/components/enhanced-heat-map"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"

// Define a consistent seed for deterministic results
const ANALYSIS_SEED = 12345

export default function AnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mediaType = searchParams.get("type") || "image"
  const location = searchParams.get("location") || "Unknown"
  const mediaId = searchParams.get("id") || Date.now().toString()

  const [loading, setLoading] = useState(true)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("heatmap")
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const analysisComplete = useRef(false)

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

  useEffect(() => {
    if (!isAuthenticated) return

    // Reset state when media type or location changes
    setLoading(true)
    setError(null)
    analysisComplete.current = false

    // Simulate loading analysis data with deterministic results
    const timer = setTimeout(() => {
      try {
        // Use a deterministic random generator based on mediaId and type
        const seed = hashCode(`${mediaId}-${mediaType}-${location}-${ANALYSIS_SEED}`)
        const randomGen = seededRandom(seed)

        // Generate consistent analysis data
        const mockData = {
          crowdCount: Math.floor(randomGen() * 100 + 100),
          density: Math.floor(randomGen() * 40 + 40),
          anomalies:
            randomGen() > 0.7
              ? [
                  {
                    type: "crowd_surge",
                    confidence: Number.parseFloat((0.75 + randomGen() * 0.2).toFixed(2)),
                    location: randomGen() > 0.5 ? "center" : "northeast",
                    timestamp: new Date().toISOString(),
                  },
                ]
              : [],
          timestamp: new Date().toISOString(),
          processingTime: Number.parseFloat((0.5 + randomGen() * 1.5).toFixed(2)),
          heatmapData: generateHeatmapData(randomGen),
        }

        setAnalysisData(mockData)
        analysisComplete.current = true
        setLoading(false)
      } catch (err) {
        console.error("Error generating analysis:", err)
        setError("Failed to analyze media. Please try again.")
        setLoading(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [mediaType, location, mediaId, isAuthenticated])

  // Generate consistent heatmap data
  const generateHeatmapData = (randomGen: () => number) => {
    return {
      hotspots: [
        { x: 0.3, y: 0.2, radius: 0.15, intensity: 0.8 },
        { x: 0.7, y: 0.3, radius: 0.18, intensity: 0.7 },
        { x: 0.5, y: 0.7, radius: 0.2, intensity: 0.9 },
        { x: 0.8, y: 0.8, radius: 0.12, intensity: 0.75 },
        { x: 0.4, y: 0.5, radius: 0.14, intensity: 0.85 },
      ],
      crowdCount: Math.floor(randomGen() * 100 + 100),
      density: Math.floor(randomGen() * 40 + 40),
    }
  }

  // Simple string hash function for deterministic random seed
  const hashCode = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  // Seeded random number generator
  const seededRandom = (seed: number) => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }

  const handleExport = () => {
    if (!analysisData) return

    // Create CSV data
    const csvData = [
      ["Analysis Report", ""],
      ["Media Type", mediaType],
      ["Location", location],
      ["Timestamp", new Date(analysisData.timestamp).toLocaleString()],
      ["Crowd Count", analysisData.crowdCount],
      ["Density", `${analysisData.density}%`],
      ["Anomalies", analysisData.anomalies.length],
      ["Processing Time", `${analysisData.processingTime}s`],
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
  }

  const handleShare = () => {
    // Create a shareable link with the same mediaId to ensure consistent results
    const shareUrl = `${window.location.origin}/shared?id=${mediaId}&type=${mediaType}&location=${encodeURIComponent(location)}`

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
                    {!loading && analysisData && `Processed in ${analysisData.processingTime}s`}
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
                    <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                  </TabsList>

                  <TabsContent value="heatmap">
                    <EnhancedHeatMap
                      location={location}
                      sensorStatus="online"
                      mediaSource={mediaType as any}
                      height={400}
                      analysisData={analysisData?.heatmapData}
                      isLoading={loading}
                    />
                  </TabsContent>

                  <TabsContent value="density">
                    {loading ? (
                      <Skeleton className="h-[400px] w-full" />
                    ) : (
                      <div className="h-[400px] flex flex-col items-center justify-center border rounded-md">
                        <div className="text-center">
                          <div className="text-6xl font-bold mb-4">{analysisData.density}%</div>
                          <p className="text-xl">Crowd Density</p>
                          <p className="text-muted-foreground mt-2">
                            Based on {mediaType} analysis at {location}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="anomalies">
                    {loading ? (
                      <Skeleton className="h-[400px] w-full" />
                    ) : analysisData.anomalies.length > 0 ? (
                      <div className="space-y-4">
                        {analysisData.anomalies.map((anomaly: any, index: number) => (
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
                        <p className="text-muted-foreground">No anomalies detected</p>
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
                <CardTitle>Analysis Summary</CardTitle>
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
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Crowd Count</span>
                      <span className="text-xl font-bold">{analysisData.crowdCount}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Density</span>
                      <span className="text-xl font-bold">{analysisData.density}%</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">Anomalies</span>
                      <span className="text-xl font-bold">{analysisData.anomalies.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Timestamp</span>
                      <span className="text-sm">{new Date(analysisData.timestamp).toLocaleString()}</span>
                    </div>
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

