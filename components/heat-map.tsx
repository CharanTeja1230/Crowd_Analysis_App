"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeatMapProps {
  location: string
  width?: number
  height?: number
  sensorStatus: "online" | "offline" | "warning"
  className?: string
}

export function HeatMap({ location, width = 600, height = 400, sensorStatus, className }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"real-time" | "historical">("real-time")
  const [animationFrame, setAnimationFrame] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [heatmapData, setHeatmapData] = useState<any | null>(null)

  // Effect for initial load and location changes
  useEffect(() => {
    setLoading(true)
    setError(null)

    // Only fetch heatmap data if sensors are online
    if (sensorStatus === "online") {
      fetchHeatmapData()
        .then((data) => {
          setHeatmapData(data)
          setLoading(false)
          setLastUpdated(new Date().toLocaleTimeString())
        })
        .catch((err) => {
          console.error("Error fetching heatmap data:", err)
          setError("Failed to load heatmap data. Please try again.")
          setLoading(false)
        })
    } else {
      // If sensors are offline, clear heatmap data
      setHeatmapData(null)
      setLoading(false)
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [location, sensorStatus, activeTab])

  // Continuous animation for real-time view
  useEffect(() => {
    let frameId: number | null = null

    if (!loading && sensorStatus === "online" && activeTab === "real-time") {
      const animate = () => {
        try {
          renderHeatmap()
          setLastUpdated(new Date().toLocaleTimeString())
          frameId = requestAnimationFrame(animate)
        } catch (err) {
          console.error("Error in animation frame:", err)
          if (frameId) {
            cancelAnimationFrame(frameId)
          }
        }
      }

      frameId = requestAnimationFrame(animate)
      setAnimationFrame(frameId)
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [loading, sensorStatus, activeTab, heatmapData])

  // Fetch heatmap data from API
  const fetchHeatmapData = async () => {
    // In a real app, this would be an API call
    // For demo purposes, we'll generate mock data

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate deterministic data based on location
    const seed = hashString(location)
    const random = seededRandom(seed)

    // Generate hotspots
    const hotspots = []
    const hotspotCount = Math.floor(random() * 5) + 3 // 3-7 hotspots

    for (let i = 0; i < hotspotCount; i++) {
      hotspots.push({
        x: random(),
        y: random(),
        radius: 0.1 + random() * 0.15,
        intensity: 0.6 + random() * 0.4,
      })
    }

    return {
      hotspots,
      timestamp: new Date().toISOString(),
      crowdCount: Math.floor(random() * 200) + 50,
      density: Math.floor(random() * 60) + 20,
    }
  }

  const renderHeatmap = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Don't draw heatmap if sensors are offline
    if (sensorStatus !== "online" || !heatmapData) {
      drawNoDataMessage(ctx, canvas.width, canvas.height)
      return
    }

    // Apply zoom
    ctx.save()
    ctx.scale(zoomLevel, zoomLevel)

    // Draw clean background
    drawCleanBackground(ctx, canvas.width / zoomLevel, canvas.height / zoomLevel)

    // Draw heatmap
    drawHeatmap(ctx, canvas.width / zoomLevel, canvas.height / zoomLevel, heatmapData)

    // Restore canvas state
    ctx.restore()

    // Add timestamp
    addTimestamp(ctx, canvas.width, canvas.height)
  }

  const drawCleanBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw a clean white/light background
    ctx.fillStyle = "#f8fafc" // Light background
    ctx.fillRect(0, 0, width, height)

    // Add grid lines for reference
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 0.5

    // Draw grid lines
    const gridSize = 40
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawNoDataMessage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = "#64748b"
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(
      sensorStatus === "online" ? "Waiting for data..." : "Sensors offline - No data available",
      width / 2,
      height / 2,
    )

    if (sensorStatus !== "online") {
      ctx.font = "14px sans-serif"
      ctx.fillText("Turn on sensors to view heatmap", width / 2, height / 2 + 30)
    }
  }

  const drawHeatmap = (ctx: CanvasRenderingContext2D, width: number, height: number, data: any) => {
    // Draw hotspots
    if (data.hotspots && data.hotspots.length > 0) {
      data.hotspots.forEach((spot: any) => {
        const x = spot.x * width
        const y = spot.y * height
        const radius = spot.radius * width
        const intensity = spot.intensity

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

        // Enhanced gradient with more color stops for smoother transition
        gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`)
        gradient.addColorStop(0.2, `rgba(255, 50, 0, ${intensity * 0.9})`)
        gradient.addColorStop(0.4, `rgba(255, 150, 0, ${intensity * 0.7})`)
        gradient.addColorStop(0.6, `rgba(255, 255, 0, ${intensity * 0.5})`)
        gradient.addColorStop(0.8, `rgba(0, 150, 255, ${intensity * 0.3})`)
        gradient.addColorStop(1, "rgba(0, 0, 255, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Add crowd count if available
    if (data.crowdCount) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(width - 100, 10, 90, 24)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 12px sans-serif"
      ctx.fillText(`Count: ${data.crowdCount}`, width - 90, 25)
    }

    // Add density if available
    if (data.density) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(width - 100, 40, 90, 24)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 12px sans-serif"
      ctx.fillText(`Density: ${data.density}%`, width - 90, 55)
    }
  }

  const addTimestamp = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Only add timestamp
    const now = new Date()
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.font = "10px sans-serif"
    ctx.fillText(`Last updated: ${lastUpdated || now.toLocaleTimeString()}`, width - 150, height - 10)
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.6))
  }

  const handleReset = () => {
    setZoomLevel(1)
  }

  // Helper function to generate a hash from a string
  const hashString = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  // Seeded random number generator for consistent results
  const seededRandom = (seed: number) => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Heat Map</CardTitle>
          <Tabs
            defaultValue="real-time"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "real-time" | "historical")}
            className="h-8"
          >
            <TabsList className="h-8">
              <TabsTrigger value="real-time" className="text-xs px-3">
                Real-time
              </TabsTrigger>
              <TabsTrigger value="historical" className="text-xs px-3">
                Historical
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>Crowd density distribution at {location}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[400px] items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Skeleton className="mb-2 h-4 w-32 mx-auto" />
              <p className="text-sm">Loading heat map...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-[400px] flex flex-col items-center justify-center border border-dashed rounded-md">
            <Alert variant="destructive" className="max-w-md">
              <Info className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="rounded-md border w-full h-auto shadow-sm"
            />

            {/* Zoom controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom In</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom Out</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black"
                onClick={handleReset}
              >
                <RotateCw className="h-4 w-4" />
                <span className="sr-only">Reset</span>
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                <span>Low Density</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                <span>Medium Density</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-red-500"></div>
                <span>High Density</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              {activeTab === "real-time" ? (
                <p>
                  {sensorStatus === "online"
                    ? `Showing real-time crowd density at ${location}. Zoom: ${Math.round(zoomLevel * 100)}%`
                    : `Sensors offline. Turn on sensors to view real-time data.`}
                </p>
              ) : (
                <p>
                  {sensorStatus === "online"
                    ? `Showing historical crowd patterns for ${location} over the past 24 hours.`
                    : `Sensors offline. Historical data may be outdated.`}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
