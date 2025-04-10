"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronRight, TrendingUp, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PredictionsProps {
  location: string
  sensorStatus: "online" | "offline" | "warning"
}

export function Predictions({ location, sensorStatus }: PredictionsProps) {
  const [loading, setLoading] = useState(true)
  const [predictionData, setPredictionData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("hour")

  useEffect(() => {
    // Reset state when location changes
    setLoading(true)
    setError(null)

    // Only generate predictions if sensors are online
    if (sensorStatus !== "online") {
      setError("Predictions require active sensors. Please ensure sensors are online.")
      setLoading(false)
      return
    }

    // Simulate loading prediction data
    const timer = setTimeout(() => {
      try {
        // Generate prediction data
        const hourData = generateHourlyData()
        const dayData = generateDailyData()
        const weekData = generateWeeklyData()

        setPredictionData({
          hour: hourData,
          day: dayData,
          week: weekData,
        })
        setLoading(false)
      } catch (err) {
        console.error("Error generating predictions:", err)
        setError("Failed to generate predictions. Please try again later.")
        setLoading(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [location, sensorStatus])

  // Generate hourly prediction data
  const generateHourlyData = () => {
    const now = new Date()
    return Array.from({ length: 12 }).map((_, i) => {
      const hour = new Date()
      hour.setHours(now.getHours() + i)

      // Create realistic patterns based on time of day
      let density
      const hourOfDay = hour.getHours()

      if (hourOfDay >= 17 && hourOfDay <= 19) {
        // Evening rush hour
        density = 65 + Math.random() * 25
      } else if (hourOfDay >= 7 && hourOfDay <= 9) {
        // Morning rush hour
        density = 60 + Math.random() * 20
      } else if (hourOfDay >= 12 && hourOfDay <= 14) {
        // Lunch hour
        density = 50 + Math.random() * 15
      } else if (hourOfDay >= 22 || hourOfDay <= 5) {
        // Night time
        density = 5 + Math.random() * 15
      } else {
        // Regular hours
        density = 20 + Math.random() * 30
      }

      return {
        time: hour.getHours() + ":00",
        density: Math.floor(density),
        confidence: 0.7 + Math.random() * 0.3,
      }
    })
  }

  // Generate daily prediction data
  const generateDailyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.

    return days.map((day, index) => {
      // Adjust index to start from current day
      const adjustedIndex = (currentDay + index) % 7

      // Weekend days have different patterns
      const isWeekend = adjustedIndex === 0 || adjustedIndex === 6

      let density
      if (isWeekend) {
        density = 30 + Math.random() * 40 // Lower on weekends
      } else {
        density = 50 + Math.random() * 30 // Higher on weekdays
      }

      return {
        time: day,
        density: Math.floor(density),
        confidence: 0.6 + Math.random() * 0.3,
      }
    })
  }

  // Generate weekly prediction data
  const generateWeeklyData = () => {
    return Array.from({ length: 4 }).map((_, i) => {
      const week = i + 1

      // Random seasonal variations
      const density = 40 + Math.random() * 30

      return {
        time: `Week ${week}`,
        density: Math.floor(density),
        confidence: 0.5 + Math.random() * 0.3, // Lower confidence for longer-term predictions
      }
    })
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const getPeakTime = () => {
    if (!predictionData || !predictionData[activeTab]) return null

    let maxDensity = 0
    let peakTime = ""

    predictionData[activeTab].forEach((item: any) => {
      if (item.density > maxDensity) {
        maxDensity = item.density
        peakTime = item.time
      }
    })

    return { time: peakTime, density: maxDensity }
  }

  const peak = getPeakTime()

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Predictions</CardTitle>
          <Tabs defaultValue="hour" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="hour" className="text-xs">
                Hour
              </TabsTrigger>
              <TabsTrigger value="day" className="text-xs">
                Day
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs">
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>Predicted crowd density at {location}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : error ? (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-[200px]"
            >
              <ChartContainer
                className="h-[200px]"
                config={{
                  density: {
                    label: "Density",
                    color: "hsl(var(--chart-1))",
                  },
                  confidence: {
                    label: "Confidence",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionData[activeTab]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="density"
                      stroke="var(--color-density)"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="confidence"
                      stroke="var(--color-confidence)"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </motion.div>

            {peak && (
              <motion.div
                className="mt-4 rounded-md bg-amber-50 p-3 dark:bg-amber-950/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Prediction Alert</h4>
                    <p className="text-xs text-muted-foreground">
                      High crowd density expected at {peak.time}
                      <span className="ml-1 font-medium">({peak.density}% occupancy)</span>
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </motion.div>
            )}

            <motion.div
              className="mt-4 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p>
                Predictions are based on historical patterns, current sensor data, and machine learning models. Accuracy
                may vary based on unexpected events or weather conditions.
              </p>
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
