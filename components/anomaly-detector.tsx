"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AlertCircle, BarChart4, Info, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Anomaly {
  id: string
  type: "surge" | "dispersal" | "noise" | "unusual"
  timestamp: string
  description: string
  severity: "low" | "medium" | "high"
}

interface AnomalyDetectorProps {
  location: string
  sensorStatus: "online" | "offline" | "warning"
}

export function AnomalyDetector({ location, sensorStatus }: AnomalyDetectorProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch data if sensors are online
    if (sensorStatus !== "online") {
      setLoading(false)
      return
    }

    // Simulate loading anomaly data
    const timer = setTimeout(() => {
      setLoading(false)

      try {
        // Generate random anomalies
        const types = ["surge", "dispersal", "noise", "unusual"] as const
        const severities = ["low", "medium", "high"] as const
        const anomalyCount = Math.floor(Math.random() * 4) // 0-3 anomalies

        const newAnomalies = Array.from({ length: anomalyCount }).map((_, i) => {
          const type = types[Math.floor(Math.random() * types.length)]
          const severity = severities[Math.floor(Math.random() * severities.length)]
          const minutesAgo = Math.floor(Math.random() * 60)
          const timestamp = new Date(Date.now() - minutesAgo * 60000).toISOString()

          let description = ""
          if (type === "surge") {
            description = `Sudden crowd surge detected at ${location}`
          } else if (type === "dispersal") {
            description = `Rapid crowd dispersal detected at ${location}`
          } else if (type === "noise") {
            description = `Unusual noise levels detected at ${location}`
          } else {
            description = `Unusual crowd behavior detected at ${location}`
          }

          return {
            id: `anomaly-${i}-${Date.now()}`,
            type,
            timestamp,
            description,
            severity,
          }
        })

        setAnomalies(newAnomalies)
      } catch (err) {
        console.error("Error generating anomalies:", err)
        setError("Failed to load anomaly data. Please try again.")
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [location, sensorStatus])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "warning"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case "surge":
        return <BarChart4 className="h-4 w-4" />
      case "dispersal":
        return <AlertCircle className="h-4 w-4" />
      case "noise":
        return <Info className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes === 1) return "1 minute ago"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return "1 hour ago"
    return `${diffInHours} hours ago`
  }

  if (sensorStatus !== "online") {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Anomaly Detection</CardTitle>
            <Badge>0 detected</Badge>
          </div>
          <CardDescription>Unusual crowd behavior at {location}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anomaly detection requires active sensors. Please enable sensors to detect anomalies.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Anomaly Detection</CardTitle>
          <Badge>{anomalies.length} detected</Badge>
        </div>
        <CardDescription>Unusual crowd behavior at {location}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-md bg-muted"></div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : anomalies.length > 0 ? (
          <div className="space-y-2">
            {anomalies.map((anomaly, index) => (
              <motion.div
                key={anomaly.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Alert key={anomaly.id} variant={getSeverityColor(anomaly.severity) as any}>
                  <div className="flex items-center">
                    {getAnomalyIcon(anomaly.type)}
                    <div className="ml-2">
                      <AlertTitle className="text-sm font-medium">
                        {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} Detected
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        {anomaly.description}
                        <div className="mt-1 text-xs opacity-80">{formatTimeAgo(anomaly.timestamp)}</div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex h-[200px] items-center justify-center rounded-md border border-dashed"
          >
            <div className="text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No anomalies detected</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setLoading(true)
                  setTimeout(() => {
                    const types = ["surge", "dispersal", "noise", "unusual"] as const
                    const severities = ["low", "medium", "high"] as const

                    // Generate a test anomaly
                    const testAnomaly = {
                      id: `anomaly-test-${Date.now()}`,
                      type: types[Math.floor(Math.random() * types.length)],
                      timestamp: new Date().toISOString(),
                      description: `Test anomaly detected at ${location}`,
                      severity: severities[Math.floor(Math.random() * severities.length)],
                    }

                    setAnomalies([testAnomaly])
                    setLoading(false)
                  }, 1000)
                }}
              >
                Simulate Anomaly
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
