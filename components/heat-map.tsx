"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HeatMapProps {
  location: string
  width?: number
  height?: number
}

export function HeatMap({ location, width = 400, height = 300 }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading heatmap data
    const timer = setTimeout(() => {
      setLoading(false)
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw mock heatmap
      drawMockHeatmap(ctx, canvas.width, canvas.height)
    }, 1000)

    return () => clearTimeout(timer)
  }, [location])

  const drawMockHeatmap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw mock layout (buildings/streets)
    ctx.fillStyle = "#f1f5f9"
    ctx.fillRect(0, 0, width, height)

    // Draw streets
    ctx.fillStyle = "#cbd5e1"
    ctx.fillRect(width * 0.2, 0, width * 0.1, height)
    ctx.fillRect(0, height * 0.4, width, height * 0.1)

    // Draw random hotspots
    const spots = [
      { x: width * 0.3, y: height * 0.2, radius: width * 0.1, intensity: 0.8 },
      { x: width * 0.7, y: height * 0.3, radius: width * 0.15, intensity: 0.6 },
      { x: width * 0.5, y: height * 0.7, radius: width * 0.2, intensity: 0.9 },
      { x: width * 0.8, y: height * 0.8, radius: width * 0.1, intensity: 0.7 },
    ]

    spots.forEach((spot) => {
      const gradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.radius)

      // Create heat gradient
      gradient.addColorStop(0, `rgba(255, 0, 0, ${spot.intensity})`)
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${spot.intensity * 0.5})`)
      gradient.addColorStop(1, "rgba(0, 0, 255, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2)
      ctx.fill()
    })

    // Add some labels
    ctx.fillStyle = "#1e293b"
    ctx.font = "12px sans-serif"
    ctx.fillText("Main Street", width * 0.15, height * 0.38)
    ctx.fillText("Market", width * 0.3, height * 0.2)
    ctx.fillText("Station", width * 0.7, height * 0.32)
    ctx.fillText("Park", width * 0.5, height * 0.75)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Heat Map</CardTitle>
        <CardDescription>Crowd density distribution at {location}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted"></div>
              <p className="text-sm">Loading heat map...</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <canvas ref={canvasRef} width={width} height={height} className="rounded-md border" />
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span>High</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

