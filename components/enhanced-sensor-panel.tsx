"use client"

import { useState, useEffect, useRef } from "react"
import {
  Activity,
  AlertCircle,
  Thermometer,
  Volume2,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  MoveIcon as MotionIcon,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { generateMockSensorData, fetchRealSensorData, type ESP32Data } from "@/lib/sensor-types"
import { toast } from "@/components/ui/use-toast"

interface EnhancedSensorPanelProps {
  location: string
  sensorStatus: "online" | "offline" | "warning"
  onSensorStatusChange?: (status: "online" | "offline" | "warning") => void
}

// Key for storing sensor status in localStorage
const SENSOR_STATUS_KEY = "crowd_analysis_sensor_status"

export function EnhancedSensorPanel({ location, sensorStatus, onSensorStatusChange }: EnhancedSensorPanelProps) {
  const [sensorData, setSensorData] = useState<ESP32Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const dataFetchRef = useRef<boolean>(false)

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

  // Fetch sensor data based on status
  useEffect(() => {
    let isMounted = true
    dataFetchRef.current = true

    const fetchData = async () => {
      if (sensorStatus !== "online") {
        setSensorData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Try to fetch real sensor data first
        const realData = await fetchRealSensorData(location)

        if (isMounted && dataFetchRef.current) {
          if (realData) {
            setSensorData(realData)
            setConnectionAttempts(0) // Reset connection attempts on success
            setLastUpdated(new Date())
          } else {
            // Fall back to mock data if real data fetch fails
            const mockData = generateMockSensorData(location, true)
            setSensorData(mockData)
            setLastUpdated(new Date())

            // Increment connection attempts
            setConnectionAttempts((prev) => prev + 1)

            // If too many failed attempts, set status to warning
            if (connectionAttempts > 3 && onSensorStatusChange) {
              onSensorStatusChange("warning")
            }
          }
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching sensor data:", err)
        if (isMounted && dataFetchRef.current) {
          setError("Failed to fetch sensor data. Please try again.")
          setLoading(false)

          // Increment connection attempts
          setConnectionAttempts((prev) => prev + 1)

          // If too many failed attempts, set status to warning
          if (connectionAttempts > 5 && onSensorStatusChange) {
            onSensorStatusChange("warning")
          }
        }
      }
    }

    // Initial fetch
    fetchData()

    // Set up interval for periodic updates
    if (sensorStatus === "online") {
      if (!intervalId) {
        const interval = setInterval(fetchData, 3000) // Faster updates for better responsiveness
        setIntervalId(interval)
      }
    } else {
      // Clear interval if sensors are offline
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
      isMounted = false
      dataFetchRef.current = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [sensorStatus, location, intervalId, connectionAttempts, onSensorStatusChange])

  const handleToggleSensors = async () => {
    if (!onSensorStatusChange) return

    setIsChangingStatus(true)

    try {
      // In a real app, this would call an API to turn sensors on/off
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newStatus = sensorStatus === "online" ? "offline" : "online"
      onSensorStatusChange(newStatus)

      // Show toast notification
      toast({
        title: newStatus === "online" ? "Sensors Activated" : "Sensors Deactivated",
        description:
          newStatus === "online"
            ? "IoT sensors are now online and collecting data"
            : "IoT sensors have been turned off",
      })

      // Reset connection attempts when turning on
      if (newStatus === "online") {
        setConnectionAttempts(0)
      }
    } catch (err) {
      console.error("Error toggling sensor status:", err)
      setError("Failed to change sensor status. Please try again.")

      toast({
        title: "Error",
        description: "Failed to change sensor status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingStatus(false)
    }
  }

  // Format time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return "Never"

    const now = new Date()
    const diff = now.getTime() - lastUpdated.getTime()

    if (diff < 60000) {
      return "Just now"
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    } else {
      return lastUpdated.toLocaleTimeString()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>IoT Sensor Hub</CardTitle>
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
        <CardDescription>Environmental sensors at {location}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChangingStatus && (
          <Alert variant="default">
            <Activity className="h-4 w-4 animate-pulse" />
            <AlertTitle>{sensorStatus === "online" ? "Turning off sensors..." : "Turning on sensors..."}</AlertTitle>
            <AlertDescription>Please wait while we update the sensor status.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && sensorStatus === "online" ? (
          <div className="py-4 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Connecting to sensors...</p>
          </div>
        ) : sensorStatus !== "online" ? (
          <Alert variant={sensorStatus === "warning" ? "warning" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sensors {sensorStatus === "warning" ? "Unstable" : "Offline"}</AlertTitle>
            <AlertDescription>
              {sensorStatus === "warning"
                ? "Sensor connection is unstable. Data may be intermittent."
                : "The sensors at this location are currently offline. No data available."}
            </AlertDescription>
          </Alert>
        ) : sensorData ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm font-medium">
                    <Thermometer className="mr-2 h-4 w-4 text-blue-500" />
                    Temperature
                  </span>
                  <span className="text-sm">{sensorData.sensors.temperature.value.toFixed(1)}°C</span>
                </div>
                <Progress value={(sensorData.sensors.temperature.value / 40) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm font-medium">
                    <Activity className="mr-2 h-4 w-4 text-green-500" />
                    Humidity
                  </span>
                  <span className="text-sm">{sensorData.sensors.humidity.value.toFixed(1)}%</span>
                </div>
                <Progress value={sensorData.sensors.humidity.value} className="h-2" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm font-medium">
                  <Volume2 className="mr-2 h-4 w-4 text-purple-500" />
                  Sound Level
                </span>
                <span className="text-sm">{sensorData.sensors.sound.value}dB</span>
              </div>
              <Progress
                value={sensorData.sensors.sound.value}
                className="h-2"
                indicatorClassName={sensorData.sensors.sound.value > 80 ? "bg-red-500" : undefined}
              />

              {sensorData.sensors.sound.value > 80 && (
                <div className="mt-2 text-xs text-red-500">Abnormal noise levels detected!</div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <span className="flex items-center mr-4">
                  <MotionIcon className="mr-1 h-4 w-4 text-amber-500" />
                  Motion: {sensorData.sensors.motion.detected ? "Detected" : "None"}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="flex items-center">
                  {sensorData.battery > 50 ? (
                    <BatteryCharging className="mr-1 h-4 w-4 text-green-500" />
                  ) : (
                    <Battery className="mr-1 h-4 w-4 text-amber-500" />
                  )}
                  {sensorData.battery}%
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-right">Last Updated: {getTimeSinceUpdate()}</div>
          </>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            <p>No sensor data available</p>
          </div>
        )}

        {sensorStatus === "offline" && (
          <Button
            variant="outline"
            className="w-full mt-2 gap-2"
            onClick={handleToggleSensors}
            disabled={isChangingStatus}
          >
            <Wifi className="h-4 w-4" />
            Turn On Sensors
          </Button>
        )}

        {sensorStatus === "warning" && (
          <Button
            variant="outline"
            className="w-full mt-2 gap-2"
            onClick={handleToggleSensors}
            disabled={isChangingStatus}
          >
            <Activity className="h-4 w-4" />
            Reconnect Sensors
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
