"use client"

import { useState, useEffect } from "react"
import { Activity, AlertCircle, Battery, Thermometer, Volume2, Wifi, WifiOff } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { type ESP32Data, type SensorReadings, generateMockSensorData } from "@/lib/sensor-types"

interface EnhancedSensorPanelProps {
  location: string
  sensorStatus: "online" | "offline" | "warning"
  onSensorStatusChange?: (status: "online" | "offline" | "warning") => void
}

export function EnhancedSensorPanel({ location, sensorStatus, onSensorStatusChange }: EnhancedSensorPanelProps) {
  const [sensorData, setSensorData] = useState<ESP32Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simulate fetching sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      setLoading(true)
      setError(null)

      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/sensors?location=${encodeURIComponent(location)}`);
        // const data = await response.json();

        // For demo, we'll generate mock data
        const isOnline = sensorStatus === "online"
        const mockData = generateMockSensorData(location, isOnline)

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setSensorData(mockData)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching sensor data:", err)
        setError("Failed to fetch sensor data")
        setLoading(false)
      }
    }

    fetchSensorData()

    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(fetchSensorData, 5000)

    return () => clearInterval(interval)
  }, [location, sensorStatus])

  // Toggle sensor status (for demo purposes)
  const toggleSensorStatus = () => {
    const newStatus = sensorStatus === "online" ? "offline" : "online"
    if (onSensorStatusChange) {
      onSensorStatusChange(newStatus)
    }
  }

  // Format temperature with unit
  const formatTemperature = (temp: number) => {
    return `${temp.toFixed(1)}°C`
  }

  // Get color based on value
  const getValueColor = (type: keyof SensorReadings, value: number) => {
    if (type === "temperature") {
      if (value > 30) return "text-red-500"
      if (value < 15) return "text-blue-500"
      return "text-green-500"
    }

    if (type === "humidity") {
      if (value > 70) return "text-blue-500"
      if (value < 30) return "text-amber-500"
      return "text-green-500"
    }

    if (type === "sound") {
      if (value > 80) return "text-red-500"
      if (value > 60) return "text-amber-500"
      return "text-green-500"
    }

    return ""
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>IoT Sensor Hub</CardTitle>
          <Badge
            variant={sensorStatus === "online" ? "success" : sensorStatus === "warning" ? "warning" : "destructive"}
          >
            {sensorStatus === "online" ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
            {sensorStatus === "online" ? "Online" : sensorStatus === "warning" ? "Weak Signal" : "Offline"}
          </Badge>
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>ESP32 sensor readings at {location}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={toggleSensorStatus}>
            {sensorStatus === "online" ? "Simulate Offline" : "Simulate Online"}
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
            <div className="h-8 animate-pulse rounded bg-muted"></div>
            <div className="h-8 animate-pulse rounded bg-muted"></div>
            <div className="h-8 animate-pulse rounded bg-muted"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : sensorStatus === "offline" ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sensors Offline</AlertTitle>
            <AlertDescription>
              The sensors at {location} are currently offline. Data may be outdated or unavailable.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm font-medium">
                    <Thermometer className="mr-2 h-4 w-4 text-blue-500" />
                    Temperature
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      getValueColor("temperature", sensorData?.sensors.temperature.value || 0),
                    )}
                  >
                    {formatTemperature(sensorData?.sensors.temperature.value || 0)}
                  </span>
                </div>
                <Progress
                  value={((sensorData?.sensors.temperature.value || 0) / 40) * 100}
                  className="h-2"
                  indicatorClassName={
                    sensorData?.sensors.temperature.value && sensorData.sensors.temperature.value > 30
                      ? "bg-red-500"
                      : sensorData?.sensors.temperature.value && sensorData.sensors.temperature.value < 15
                        ? "bg-blue-500"
                        : undefined
                  }
                />
                {sensorData?.sensors.temperature.value && sensorData.sensors.temperature.value > 30 && (
                  <p className="text-xs text-red-500">High temperature detected!</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm font-medium">
                    <Activity className="mr-2 h-4 w-4 text-green-500" />
                    Humidity
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      getValueColor("humidity", sensorData?.sensors.humidity.value || 0),
                    )}
                  >
                    {sensorData?.sensors.humidity.value.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={sensorData?.sensors.humidity.value || 0}
                  className="h-2"
                  indicatorClassName={
                    sensorData?.sensors.humidity.value && sensorData.sensors.humidity.value > 70
                      ? "bg-blue-500"
                      : sensorData?.sensors.humidity.value && sensorData.sensors.humidity.value < 30
                        ? "bg-amber-500"
                        : undefined
                  }
                />
                {sensorData?.sensors.humidity.value && sensorData.sensors.humidity.value > 70 && (
                  <p className="text-xs text-blue-500">High humidity detected!</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm font-medium">
                  <Volume2 className="mr-2 h-4 w-4 text-purple-500" />
                  Sound Level
                </span>
                <span
                  className={cn("text-sm font-medium", getValueColor("sound", sensorData?.sensors.sound.value || 0))}
                >
                  {sensorData?.sensors.sound.value || 0}dB
                </span>
              </div>
              <Progress
                value={sensorData?.sensors.sound.value || 0}
                className="h-2"
                indicatorClassName={
                  sensorData?.sensors.sound.value && sensorData.sensors.sound.value > 80
                    ? "bg-red-500"
                    : sensorData?.sensors.sound.value && sensorData.sensors.sound.value > 60
                      ? "bg-amber-500"
                      : undefined
                }
              />

              {sensorData?.sensors.sound.value && sensorData.sensors.sound.value > 80 && (
                <div className="mt-2 text-xs text-red-500">Abnormal noise levels detected!</div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <Battery
                  className={cn(
                    "h-5 w-5",
                    sensorData && sensorData.battery > 50
                      ? "text-green-500"
                      : sensorData && sensorData.battery > 20
                        ? "text-amber-500"
                        : "text-red-500",
                  )}
                />
                <span className="text-sm">Battery</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={sensorData?.battery || 0}
                  className="h-2 w-24"
                  indicatorClassName={
                    sensorData && sensorData.battery > 50
                      ? "bg-green-500"
                      : sensorData && sensorData.battery > 20
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }
                />
                <span className="text-sm font-medium">{sensorData?.battery || 0}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Motion Detected: {sensorData?.sensors.motion.detected ? "Yes" : "No"}</span>
              <span>Last Updated: {new Date(sensorData?.timestamp || "").toLocaleTimeString()}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}

