"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, ZoomIn, ZoomOut, RotateCw, Map, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

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
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [renderCount, setRenderCount] = useState(0)
  const [isInitialRender, setIsInitialRender] = useState(true)

  // Generate deterministic hotspots based on location
  const generateDeterministicHotspots = useMemo(() => {
    // Create a hash from the location string
    const hash = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i)
        hash |= 0
      }
      return Math.abs(hash)
    }

    // Seeded random number generator
    const seededRandom = (seed: number) => {
      return () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }
    }

    const locationHash = hash(location)
    const random = seededRandom(locationHash)

    // Generate hotspots
    const hotspotCount = Math.floor(random() * 5) + 5 // 5-10 hotspots
    const hotspots = []

    for (let i = 0; i < hotspotCount; i++) {
      hotspots.push({
        x: random(),
        y: random(),
        radius: 0.05 + random() * 0.1,
        intensity: 0.5 + random() * 0.5,
      })
    }

    return {
      hotspots,
      crowdCount: Math.floor(random() * 150) + 50,
      density: Math.floor(random() * 60) + 20,
    }
  }, [location])

  // Effect for initial load and location/mediaSource changes
  useEffect(() => {
    // Use the provided loading state or default to true
    setLoading(true)
    setError(null)
    setIsInitialRender(true)

    // Simulate API call delay
    const timer = setTimeout(() => {
      setLoading(false)
      setLastUpdated(new Date().toLocaleTimeString())
      setIsInitialRender(false)

      try {
        renderHeatmap()
      } catch (err) {
        console.error("Error rendering heatmap:", err)
        setError("Failed to render heatmap. Please try again.")
      }
    }, 800)

    return () => {
      clearTimeout(timer)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [location, sensorStatus, mediaSource, activeTab])

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDragging(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  // Handle mouse move for panning
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })

      // Re-render heatmap with new pan offset
      renderHeatmap()
    }
  }

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle mouse leave to stop panning
  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Continuous animation for live view
  useEffect(() => {
    let frameId: number | null = null

    if (!loading && mediaSource === "live" && sensorStatus === "online") {
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
  }, [loading, mediaSource, sensorStatus, analysisData, zoomLevel, panOffset])

  // Force re-render on window resize
  useEffect(() => {
    const handleResize = () => {
      setRenderCount((prev) => prev + 1)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Re-render when renderCount changes
  useEffect(() => {
    if (!isInitialRender) {
      renderHeatmap()
    }
  }, [renderCount, isInitialRender])

  const renderHeatmap = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Don't draw heatmap if sensors are offline and no media
    if (sensorStatus === "offline" && !mediaSource) {
      drawNoDataMessage(ctx, canvas.width, canvas.height)
      return
    }

    // Apply zoom and pan
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoomLevel, zoomLevel)

    // Draw clean background (no roads, no diagrams)
    drawCleanBackground(ctx, canvas.width / zoomLevel, canvas.height / zoomLevel)

    // Draw heatmap based on source
    if (mediaSource === "live" && sensorStatus === "online") {
      // Use the provided analysis data or deterministic data for live view
      const data = analysisData || generateDeterministicHotspots
      drawMediaHeatmap(ctx, canvas.width / zoomLevel, canvas.height / zoomLevel, "live", data)
    } else if ((mediaSource === "image" || mediaSource === "video") && analysisData) {
      // Use the provided analysis data for consistent results
      drawMediaHeatmap(ctx, canvas.width / zoomLevel, canvas.height / zoomLevel, mediaSource, analysisData)
    } else if ((mediaSource === "image" || mediaSource === "video") && !analysisData) {
      // Use deterministic data for testing
      drawMediaHeatmap(
        ctx,
        canvas.width / zoomLevel,
        canvas.height / zoomLevel,
        mediaSource || "image",
        generateDeterministicHotspots,
      )
    } else if (sensorStatus === "online" && !mediaSource) {
      // Use deterministic data for sensor-only view
      drawMediaHeatmap(
        ctx,
        canvas.width / zoomLevel,
        canvas.height / zoomLevel,
        "sensor",
        generateDeterministicHotspots,
      )
    }

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
    ctx.fillText("Sensors offline - No data available", width / 2, height / 2)
    ctx.font = "14px sans-serif"
    ctx.fillText("Turn on sensors to view heatmap", width / 2, height / 2 + 30)
  }

  const drawMediaHeatmap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    type: "image" | "video" | "live" | "sensor",
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

    // Add density if available
    if (data.density) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(width - 100, 40, 90, 24)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 12px sans-serif"
      ctx.fillText(`Density: ${data.density}%`, width - 90, 55)
    }
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
    setPanOffset({ x: 0, y: 0 })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            <CardTitle>Heat Map</CardTitle>
          </div>
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
              <Loader2 className="mb-2 h-8 w-8 animate-spin mx-auto" />
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
              className="rounded-md border w-full h-auto shadow-sm cursor-grab"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            />

            {mediaSource && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {mediaSource === "live" ? "Live Feed" : mediaSource === "image" ? "Image Analysis" : "Video Analysis"}
              </div>
            )}

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

            <motion.div
              className="mt-4 flex items-center justify-between text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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
            </motion.div>

            <div className="mt-2 text-xs text-muted-foreground">
              {activeTab === "real-time" ? (
                <p>
                  Showing real-time crowd density at {location}. Zoom: {Math.round(zoomLevel * 100)}%
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
