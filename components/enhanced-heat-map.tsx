"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface HeatmapData {
  hotspots: Array<{
    x: number
    y: number
    radius: number
    intensity: number
  }>
  crowdCount?: number
  density?: number
}

interface EnhancedHeatMapProps {
  location: string
  width?: number
  height?: number
  sensorStatus: "online" | "offline" | "warning"
  mediaSource?: "live" | "image" | "video" | null
  analysisData?: HeatmapData
  isLoading?: boolean
}

export function EnhancedHeatMap({
  location,
  width = 600,
  height = 400,
  sensorStatus,
  mediaSource,
  analysisData,
  isLoading = false,
}: EnhancedHeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(isLoading)
  const [activeTab, setActiveTab] = useState<"real-time" | "historical">("real-time")
  const [animationFrame, setAnimationFrame] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Effect for initial load and location/mediaSource changes
  useEffect(() => {
    // Use the provided loading state or default to true
    setLoading(isLoading)

    if (!isLoading) {
      try {
        renderHeatmap()
      } catch (err) {
        console.error("Error rendering heatmap:", err)
        setError("Failed to render heatmap. Please try again.")
      }
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [location, sensorStatus, mediaSource, activeTab, analysisData, isLoading])

  // Continuous animation for live view
  useEffect(() => {
    let frameId: number | null = null

    if (!loading && mediaSource === "live" && sensorStatus === "online") {
      const animate = () => {
        try {
          renderHeatmap()
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
  }, [loading, mediaSource, sensorStatus])

  const renderHeatmap = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (sensorStatus === "offline" && !mediaSource) {
      // Don't draw heatmap if sensors are offline and no media
      return
    }

    // Draw base map
    drawBaseMap(ctx, canvas.width, canvas.height)

    // Draw heatmap based on source
    if (mediaSource === "live") {
      drawLiveHeatmap(ctx, canvas.width, canvas.height)
    } else if ((mediaSource === "image" || mediaSource === "video") && analysisData) {
      // Use the provided analysis data for consistent results
      drawMediaHeatmap(ctx, canvas.width, canvas.height, mediaSource, analysisData)
    } else if ((mediaSource === "image" || mediaSource === "video") && !analysisData) {
      // Fallback if no analysis data provided
      drawDefaultMediaHeatmap(ctx, canvas.width, canvas.height, mediaSource)
    } else if (sensorStatus === "online") {
      drawSensorHeatmap(ctx, canvas.width, canvas.height)
    }

    // Add labels and legends
    addLabelsAndLegends(ctx, canvas.width, canvas.height)
  }

  const drawBaseMap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw background
    ctx.fillStyle = "#f8fafc" // Light background
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw main streets
    ctx.fillStyle = "#cbd5e1"
    ctx.fillRect(width * 0.2, 0, width * 0.1, height)
    ctx.fillRect(0, height * 0.4, width, height * 0.1)

    // Draw buildings/blocks
    ctx.fillStyle = "#e2e8f0"
    // Top left block
    ctx.fillRect(width * 0.05, height * 0.05, width * 0.1, height * 0.1)
    // Top right block
    ctx.fillRect(width * 0.75, height * 0.1, width * 0.15, height * 0.15)
    // Bottom left block
    ctx.fillRect(width * 0.1, height * 0.65, width * 0.15, height * 0.2)
    // Bottom right block
    ctx.fillRect(width * 0.7, height * 0.7, width * 0.2, height * 0.15)
  }

  const drawLiveHeatmap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create more dynamic hotspots for live view
    const time = Date.now() / 1000
    const spots = [
      {
        x: width * (0.3 + Math.sin(time * 0.1) * 0.05),
        y: height * (0.2 + Math.cos(time * 0.15) * 0.05),
        radius: width * 0.15,
        intensity: 0.8 + Math.sin(time * 0.2) * 0.1,
      },
      {
        x: width * (0.7 + Math.cos(time * 0.12) * 0.03),
        y: height * (0.3 + Math.sin(time * 0.1) * 0.03),
        radius: width * 0.18,
        intensity: 0.7 + Math.cos(time * 0.25) * 0.1,
      },
      {
        x: width * (0.5 + Math.sin(time * 0.08) * 0.04),
        y: height * (0.7 + Math.cos(time * 0.13) * 0.04),
        radius: width * 0.2,
        intensity: 0.9 + Math.sin(time * 0.15) * 0.1,
      },
      {
        x: width * (0.8 + Math.cos(time * 0.1) * 0.02),
        y: height * (0.8 + Math.sin(time * 0.11) * 0.02),
        radius: width * 0.12,
        intensity: 0.75 + Math.cos(time * 0.18) * 0.1,
      },
      {
        x: width * (0.4 + Math.sin(time * 0.14) * 0.03),
        y: height * (0.5 + Math.cos(time * 0.09) * 0.03),
        radius: width * 0.14,
        intensity: 0.85 + Math.sin(time * 0.22) * 0.1,
      },
    ]

    drawHeatSpots(ctx, spots)

    // Add live indicator
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 60, 24)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px sans-serif"
    ctx.fillText("LIVE", 20, 25)

    // Add crowd count
    const crowdCount = Math.floor(Math.random() * 100 + 150)
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(width - 100, 10, 90, 24)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px sans-serif"
    ctx.fillText(`Count: ${crowdCount}`, width - 90, 25)
  }

  const drawMediaHeatmap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    type: "image" | "video",
    data: HeatmapData,
  ) => {
    // Use the provided hotspots for consistent results
    const spots = data.hotspots.map((spot) => ({
      x: width * spot.x,
      y: height * spot.y,
      radius: width * spot.radius,
      intensity: spot.intensity,
    }))

    drawHeatSpots(ctx, spots)

    // Add media type indicator
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 80, 24)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px sans-serif"
    ctx.fillText(type.toUpperCase(), 20, 25)

    // Add crowd count if available
    if (data.crowdCount) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(width - 100, 10, 90, 24)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 12px sans-serif"
      ctx.fillText(`Count: ${data.crowdCount}`, width - 90, 25)
    }
  }

  const drawDefaultMediaHeatmap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    type: "image" | "video",
  ) => {
    // Default hotspots when no analysis data is provided
    const spots = [
      { x: width * 0.3, y: height * 0.2, radius: width * 0.15, intensity: 0.8 },
      { x: width * 0.7, y: height * 0.3, radius: width * 0.18, intensity: 0.7 },
      { x: width * 0.5, y: height * 0.7, radius: width * 0.2, intensity: 0.9 },
      { x: width * 0.8, y: height * 0.8, radius: width * 0.12, intensity: 0.75 },
      { x: width * 0.4, y: height * 0.5, radius: width * 0.14, intensity: 0.85 },
    ]

    drawHeatSpots(ctx, spots)

    // Add media type indicator
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 80, 24)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px0,0,0.7)"
    ctx.fillRect(10, 10, 80, 24)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px sans-serif"
    ctx.fillText(type.toUpperCase(), 20, 25)

    // Add default crowd count
    const crowdCount = 120
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(width - 100, 10, 90, 24)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px sans-serif"
    ctx.fillText(`Count: ${crowdCount}`, width - 90, 25)
  }

  const drawSensorHeatmap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create sensor-based hotspots
    const time = Date.now() / 2000 // Slower movement for sensor data
    const spots = [
      {
        x: width * 0.3,
        y: height * 0.2,
        radius: width * 0.12,
        intensity: 0.7 + Math.sin(time * 0.1) * 0.1,
      },
      {
        x: width * 0.7,
        y: height * 0.3,
        radius: width * 0.15,
        intensity: 0.6 + Math.cos(time * 0.15) * 0.1,
      },
      {
        x: width * 0.5,
        y: height * 0.7,
        radius: width * 0.18,
        intensity: 0.8 + Math.sin(time * 0.12) * 0.1,
      },
      {
        x: width * 0.8,
        y: height * 0.8,
        radius: width * 0.1,
        intensity: 0.65 + Math.cos(time * 0.08) * 0.1,
      },
    ]

    drawHeatSpots(ctx, spots)

    // Add sensor indicator
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, 10, 90, 24)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px sans-serif"
    ctx.fillText("SENSORS", 20, 25)
  }

  const drawHeatSpots = (
    ctx: CanvasRenderingContext2D,
    spots: Array<{ x: number; y: number; radius: number; intensity: number }>,
  ) => {
    spots.forEach((spot) => {
      const gradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.radius)

      // Enhanced gradient with more color stops for smoother transition
      gradient.addColorStop(0, `rgba(255, 0, 0, ${spot.intensity})`)
      gradient.addColorStop(0.2, `rgba(255, 50, 0, ${spot.intensity * 0.9})`)
      gradient.addColorStop(0.4, `rgba(255, 150, 0, ${spot.intensity * 0.7})`)
      gradient.addColorStop(0.6, `rgba(255, 255, 0, ${spot.intensity * 0.5})`)
      gradient.addColorStop(0.8, `rgba(0, 150, 255, ${spot.intensity * 0.3})`)
      gradient.addColorStop(1, "rgba(0, 0, 255, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const addLabelsAndLegends = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add location labels
    ctx.fillStyle = "#1e293b"
    ctx.font = "14px sans-serif"
    ctx.fillText("Main Street", width * 0.15, height * 0.38)
    ctx.fillText("Market", width * 0.3, height * 0.2)
    ctx.fillText("Station", width * 0.7, height * 0.32)
    ctx.fillText("Park", width * 0.5, height * 0.75)

    // Add timestamp
    const now = new Date()
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.font = "10px sans-serif"
    ctx.fillText(`Last updated: ${now.toLocaleTimeString()}`, width - 150, height - 10)
  }

  return (
    <Card className="w-full">
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
        ) : sensorStatus === "offline" && !mediaSource ? (
          <div className="h-[400px] flex flex-col items-center justify-center border border-dashed rounded-md">
            <Alert variant="warning" className="max-w-md">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Heat map is unavailable when sensors are offline. Please connect sensors or upload media for analysis.
              </AlertDescription>
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

            {mediaSource && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {mediaSource === "live" ? "Live Feed" : mediaSource === "image" ? "Image Analysis" : "Video Analysis"}
              </div>
            )}

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
                  Showing real-time crowd density based on {mediaSource ? `${mediaSource} analysis` : "sensor data"} at{" "}
                  {location}.
                </p>
              ) : (
                <p>Showing historical crowd patterns for {location} over the past 24 hours.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

