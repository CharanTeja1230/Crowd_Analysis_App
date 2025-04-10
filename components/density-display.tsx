"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, AlertTriangle, Timer, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface DensityDisplayProps {
  location: string
  sensorStatus: "online" | "offline" | "warning"
}

export function DensityDisplay({ location, sensorStatus }: DensityDisplayProps) {
  const [density, setDensity] = useState<number | null>(null)
  const [trend, setTrend] = useState<"increasing" | "decreasing" | "stable">("stable")
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString())
  const [animateValue, setAnimateValue] = useState(false)

  useEffect(() => {
    // Only fetch data if sensors are online
    if (sensorStatus !== "online") {
      setLoading(false)
      return
    }

    // Simulate fetching density data
    const fetchDensity = async () => {
      setLoading(true)
      try {
        // In a real app, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Generate random density between 10 and 85
        const randomDensity = Math.floor(Math.random() * 75) + 10

        // Generate random trend
        const trends = ["increasing", "decreasing", "stable"] as const
        const newTrend = trends[Math.floor(Math.random() * trends.length)]

        setDensity(randomDensity)
        setTrend(newTrend)
        setLastUpdated(new Date().toLocaleTimeString())

        // Trigger animation
        setAnimateValue(true)
        setTimeout(() => setAnimateValue(false), 1000)
      } catch (error) {
        console.error("Error fetching density data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDensity()

    // Set up interval to update density every 30 seconds
    const interval = setInterval(fetchDensity, 30000)

    return () => clearInterval(interval)
  }, [location, sensorStatus])

  // Determine color based on density
  const getDensityColor = (value: number) => {
    if (value < 30) return "bg-green-500"
    if (value < 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Determine text color based on density
  const getDensityTextColor = (value: number) => {
    if (value < 30) return "text-green-500"
    if (value < 60) return "text-yellow-500"
    return "text-red-500"
  }

  // Determine status text based on density
  const getDensityStatus = (value: number) => {
    if (value < 30) return "Low"
    if (value < 60) return "Medium"
    return "High"
  }

  // Determine trend icon and text
  const getTrendInfo = (trendValue: "increasing" | "decreasing" | "stable") => {
    switch (trendValue) {
      case "increasing":
        return {
          icon: <Activity className="h-4 w-4 text-red-500" />,
          text: "Increasing",
          color: "text-red-500",
        }
      case "decreasing":
        return {
          icon: <Activity className="h-4 w-4 text-green-500" />,
          text: "Decreasing",
          color: "text-green-500",
        }
      default:
        return {
          icon: <Activity className="h-4 w-4 text-yellow-500" />,
          text: "Stable",
          color: "text-yellow-500",
        }
    }
  }

  const trendInfo = getTrendInfo(trend)

  if (sensorStatus !== "online") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crowd Density
          </CardTitle>
          <CardDescription>Real-time crowd density at {location}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <Alert variant="warning" className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Density data is unavailable when sensors are offline. Please enable sensors to view crowd density.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Crowd Density
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Timer className="h-3 w-3" />
          <span>Last updated: {lastUpdated}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="flex items-baseline">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={density}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: animateValue ? 1.2 : 1,
                    }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                      duration: 0.5,
                      scale: {
                        duration: 0.3,
                        yoyo: 1, // This creates a bounce effect
                      },
                    }}
                    className={`text-6xl font-bold ${density !== null ? getDensityTextColor(density) : ""}`}
                  >
                    {density !== null ? density : "—"}
                  </motion.p>
                  <span className="ml-2 text-2xl font-medium">%</span>
                </AnimatePresence>
              </div>
              <motion.div
                className="flex items-center gap-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {trendInfo.icon}
                <span className={`text-sm ${trendInfo.color}`}>{trendInfo.text}</span>
              </motion.div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.5 }}>
                <Progress
                  value={density || 0}
                  className="h-3"
                  indicatorClassName={density !== null ? getDensityColor(density) : ""}
                />
              </motion.div>
            </div>

            <motion.div
              className="grid grid-cols-3 gap-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="rounded-md bg-muted p-2"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`font-medium ${density !== null ? getDensityTextColor(density) : ""}`}>
                  {density !== null ? getDensityStatus(density) : "—"}
                </p>
              </motion.div>
              <motion.div
                className="rounded-md bg-muted p-2"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground">Peak Time</p>
                <p className="font-medium">18:00</p>
              </motion.div>
              <motion.div
                className="rounded-md bg-muted p-2"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="font-medium">{lastUpdated}</p>
              </motion.div>
            </motion.div>

            {density !== null && density > 70 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High crowd density detected! Consider implementing crowd control measures.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div
              className="flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  setTimeout(() => {
                    const newDensity = Math.floor(Math.random() * 75) + 10
                    setDensity(newDensity)
                    setLastUpdated(new Date().toLocaleTimeString())
                    setLoading(false)
                    setAnimateValue(true)
                    setTimeout(() => setAnimateValue(false), 1000)
                  }, 1000)
                }}
              >
                Refresh Data
              </Button>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
