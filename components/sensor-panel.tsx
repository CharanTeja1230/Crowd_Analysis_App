"use client"

import { useState, useEffect } from "react"
import { Activity, AlertCircle, Thermometer, Volume2, Wifi, WifiOff } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { getSensorData } from "@/lib/locations"

interface SensorPanelProps {
  location: string
  sensorStatus: "online" | "offline" | "warning"
}

export function SensorPanel({ location, sensorStatus }: SensorPanelProps) {
  const [sensorData, setSensorData] = useState({
    motionDetected: false,
    temperature: 0,
    humidity: 0,
    soundLevel: 0,
    lastUpdated: "",
  })

  useEffect(() => {
    // Simulate sensor data updates
    const interval = setInterval(() => {
      setSensorData(getSensorData())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>IoT Sensor Data</CardTitle>
          <Badge
            variant={sensorStatus === "online" ? "default" : sensorStatus === "warning" ? "warning" : "destructive"}
          >
            {sensorStatus === "online" ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
            {sensorStatus === "online" ? "Online" : sensorStatus === "warning" ? "Weak Signal" : "Offline"}
          </Badge>
        </div>
        <CardDescription>Real-time sensor readings at {location}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  )
}

