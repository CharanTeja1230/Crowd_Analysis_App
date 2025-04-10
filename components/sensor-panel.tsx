"use client"

import { useState, useEffect } from "react"
import { Activity, AlertCircle, Thermometer, Volume2, Wifi, WifiOff, Power } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getSensorData } from "@/lib/locations"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SensorPanelProps {
  location: string
  sensorStatus: "online" | "offline" | "warning"
  onSensorStatusChange?: (status: "online" | "offline" | "warning") => void
}

// Key for storing sensor status in localStorage
const SENSOR_STATUS_KEY = "crowd_analysis_sensor_status"

export function SensorPanel({ location, sensorStatus, onSensorStatusChange }: SensorPanelProps) {
  const [sensorData, setSensorData] = useState({
    motionDetected: false,
    temperature: 0,
    humidity: 0,
    soundLevel: 0,
    lastUpdated: "",
  })
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  // Load persisted sensor status on component mount
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem(SENSOR_STATUS_KEY)
      if (savedStatus && onSensorStatusChange) {
        onSensorStatusChange(savedStatus as "online" | "offline" | "warning")
      }
    } catch (err) {
      console.error("Error loading sensor status:", err)
    }
  }, [onSensorStatusChange])

  // Set up or clear interval based on sensor status
  useEffect(() => {
    if (sensorStatus === "online") {
      // Start the interval only if it's not already running
      if (!intervalId) {
        const interval = setInterval(() => {
          setSensorData(getSensorData())
        }, 5000)
        setIntervalId(interval)
      }
    } else {
      // Clear the interval if sensors are offline
      if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }
    }

    // Persist sensor status to localStorage
    try {
      localStorage.setItem(SENSOR_STATUS_KEY, sensorStatus)
    } catch (err) {
      console.error("Error saving sensor status:", err)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [sensorStatus, intervalId])

  const handleToggleSensors = async () => {
    if (!onSensorStatusChange) return

    setIsChangingStatus(true)

    try {
      // In a real app, this would call an API to turn sensors on/off
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newStatus = sensorStatus === "online" ? "offline" : "online"
      onSensorStatusChange(newStatus)

      // If turning on, immediately fetch sensor data
      if (newStatus === "online") {
        setSensorData(getSensorData())
      }
    } catch (err) {
      console.error("Error toggling sensor status:", err)
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>IoT Sensor Data</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={sensorStatus === "online" ? "default" : sensorStatus === "warning" ? "warning" : "destructive"}
            >
              {sensorStatus === "online" ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
              {sensorStatus === "online" ? "Online" : sensorStatus === "warning" ? "Weak Signal" : "Offline"}
            </Badge>

            <div className="flex items-center space-x-2">
              <Switch
                id="sensor-toggle"
                checked={sensorStatus === "online"}
                onCheckedChange={handleToggleSensors}
                disabled={isChangingStatus}
              />
              <Label htmlFor="sensor-toggle" className="sr-only">
                Toggle Sensors
              </Label>
            </div>
          </div>
        </div>
        <CardDescription>Real-time sensor readings at {location}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChangingStatus && (
          <Alert variant="default">
            <Activity className="h-4 w-4 animate-pulse" />
            <AlertTitle>{sensorStatus === "online" ? "Turning off sensors..." : "Turning on sensors..."}</AlertTitle>
            <AlertDescription>Please wait while we update the sensor status.</AlertDescription>
          </Alert>
        )}

        {sensorStatus === "offline" ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sensors Offline</AlertTitle>
            <AlertDescription>The sensors at {location} are currently offline. Data may be outdated.</AlertDescription>
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
                  <span className="text-sm">{sensorData.temperature.toFixed(1)}°C</span>
                </div>
                <Progress value={(sensorData.temperature / 40) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm font-medium">
                    <Activity className="mr-2 h-4 w-4 text-green-500" />
                    Humidity
                  </span>
                  <span className="text-sm">{sensorData.humidity.toFixed(1)}%</span>
                </div>
                <Progress value={sensorData.humidity} className="h-2" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm font-medium">
                  <Volume2 className="mr-2 h-4 w-4 text-purple-500" />
                  Sound Level
                </span>
                <span className="text-sm">{sensorData.soundLevel}dB</span>
              </div>
              <Progress
                value={sensorData.soundLevel}
                className="h-2"
                indicatorClassName={sensorData.soundLevel > 80 ? "bg-red-500" : undefined}
              />

              {sensorData.soundLevel > 80 && (
                <div className="mt-2 text-xs text-red-500">Abnormal noise levels detected!</div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Motion Detected: {sensorData.motionDetected ? "Yes" : "No"}</span>
              <span>Last Updated: {new Date(sensorData.lastUpdated).toLocaleTimeString()}</span>
            </div>
          </>
        )}

        {sensorStatus === "offline" && (
          <Button
            variant="outline"
            className="w-full mt-2 gap-2"
            onClick={handleToggleSensors}
            disabled={isChangingStatus}
          >
            <Power className="h-4 w-4" />
            Turn On Sensors
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
