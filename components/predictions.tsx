"use client"

import { useEffect, useState } from "react"
import { ChevronRight, Clock, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PredictionsProps {
  location: string
}

export function Predictions({ location }: PredictionsProps) {
  const [loading, setLoading] = useState(true)
  const [predictionData, setPredictionData] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading prediction data
    const timer = setTimeout(() => {
      setLoading(false)

      // Generate random prediction data
      const currentHour = new Date().getHours()
      const data = []

      // Generate data for the next 12 hours
      for (let i = 0; i < 12; i++) {
        const hour = (currentHour + i) % 24
        const hourLabel = `${hour}:00`

        // Create a peak around evening hours
        let density
        if (hour >= 17 && hour <= 19) {
          // Rush hour peak
          density = 70 + Math.floor(Math.random() * 25)
        } else if (hour >= 12 && hour <= 14) {
          // Lunch hour peak
          density = 60 + Math.floor(Math.random() * 20)
        } else if (hour >= 22 || hour <= 5) {
          // Night time low
          density = 10 + Math.floor(Math.random() * 15)
        } else {
          // Regular hours
          density = 30 + Math.floor(Math.random() * 30)
        }

        data.push({
          hour: hourLabel,
          density,
          predicted: true,
        })
      }

      setPredictionData(data)
    }, 2000)

    return () => clearTimeout(timer)
  }, [location])

  const getPeakTime = () => {
    if (!predictionData.length) return null

    let maxDensity = 0
    let peakHour = ""

    predictionData.forEach((item) => {
      if (item.density > maxDensity) {
        maxDensity = item.density
        peakHour = item.hour
      }
    })

    return { hour: peakHour, density: maxDensity }
  }

  const peak = getPeakTime()

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Predictions</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Next 12 hours</span>
          </Badge>
        </div>
        <CardDescription>Predicted crowd density at {location}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : (
          <>
            <div className="h-[200px] w-full">
              <ChartContainer
                config={{
                  density: {
                    label: "Density",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="density"
                      stroke="var(--color-density)"
                      strokeWidth={2}
                      dot={{ r: 1 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {peak && (
              <div className="mt-4 rounded-md bg-amber-50 p-3 dark:bg-amber-950/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Prediction Alert</h4>
                    <p className="text-xs text-muted-foreground">
                      High crowd density expected at {peak.hour}
                      <span className="ml-1 font-medium">({peak.density}% occupancy)</span>
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

