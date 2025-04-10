"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Battery, RefreshCw, Settings, Thermometer, Volume2, Wifi, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { type ESP32Data, type SensorStatus, generateMockSensorData, getSensorStatus } from "@/lib/sensor-types"

export default function SensorsPage() {
  const router = useRouter()
  const [sensorData, setSensorData] = useState<ESP32Data | null>(null)
  const [sensorStatus, setSensorStatus] = useState<"online" | "offline" | "warning">("online")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Simulate fetching sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      setLoading(true)

      // In a real app, this would be an API call
      // const response = await fetch('/api/sensors');
      // const data = await response.json();

      // For demo, we'll generate mock data
      const isOnline = sensorStatus === "online"
      const mockData = generateMockSensorData("Hyderabad", isOnline)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSensorData(mockData)
      setLoading(false)
    }

    fetchSensorData()
  }, [sensorStatus])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)

    // In a real app, this would be an API call
    // const response = await fetch('/api/sensors/refresh');
    // const data = await response.json();

    // For demo, we'll generate new mock data
    const isOnline = sensorStatus === "online"
    const mockData = generateMockSensorData("Hyderabad", isOnline)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSensorData(mockData)
    setRefreshing(false)
  }

  // Toggle sensor status (for demo purposes)
  const toggleSensorStatus = () => {
    setSensorStatus((prev) => (prev === "online" ? "offline" : "online"))
  }

  // Get sensor status object
  const sensorStatusObj: SensorStatus = getSensorStatus(sensorStatus === "online" ? sensorData : undefined)

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatusObj} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">IoT Sensors</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleSensorStatus}>
              {sensorStatus === "online" ? (
                <>
                  <WifiOff className="mr-2 h-4 w-4" />
                  Simulate Offline
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Simulate Online
                </>
              )}
            </Button>

            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>ESP32 Sensor Hub</CardTitle>
                <Badge variant={sensorStatus === "online" ? "success" : "destructive"}>
                  {sensorStatus === "online" ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
                  {sensorStatus === "online" ? "Online" : "Offline"}
                </Badge>
              </div>
              <CardDescription>Device ID: {sensorData?.deviceId || "Unknown"}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Battery</p>
                    <div className="flex items-center gap-2">
                      <Progress value={sensorData?.battery || 0} className="h-2 w-24" />
                      <span className="text-sm">{sensorData?.battery || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Last Update</p>
                    <p className="text-sm">
                      {sensorData ? new Date(sensorData.timestamp).toLocaleTimeString() : "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm">{sensorData?.location || "Unknown"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/sensors/config")}>
                <Settings className="mr-2 h-4 w-4" />
                Configure Sensors
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Sensors</TabsTrigger>
            <TabsTrigger value="motion">Motion</TabsTrigger>
            <TabsTrigger value="sound">Sound</TabsTrigger>
            <TabsTrigger value="temperature">Temperature</TabsTrigger>
            <TabsTrigger value="humidity">Humidity</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SensorCard
                title="Motion Sensor (HC-SR501)"
                icon={<Wifi className="h-5 w-5 text-green-500" />}
                status={sensorStatusObj.motion}
                value={sensorData?.sensors.motion.detected ? "Detected" : "Not Detected"}
                lastUpdated={sensorData?.timestamp}
              />

              <SensorCard
                title="Sound Sensor"
                icon={<Volume2 className="h-5 w-5 text-purple-500" />}
                status={sensorStatusObj.sound}
                value={`${sensorData?.sensors.sound.value || 0} dB`}
                lastUpdated={sensorData?.timestamp}
              />

              <SensorCard
                title="Temperature Sensor (DHT11)"
                icon={<Thermometer className="h-5 w-5 text-red-500" />}
                status={sensorStatusObj.temperature}
                value={`${sensorData?.sensors.temperature.value.toFixed(1) || 0}°C`}
                lastUpdated={sensorData?.timestamp}
              />

              <SensorCard
                title="Humidity Sensor (DHT11)"
                icon={<Thermometer className="h-5 w-5 text-blue-500" />}
                status={sensorStatusObj.humidity}
                value={`${sensorData?.sensors.humidity.value.toFixed(1) || 0}%`}
                lastUpdated={sensorData?.timestamp}
              />
            </div>
          </TabsContent>

          <TabsContent value="motion">
            <DetailedSensorView
              title="Motion Sensor (HC-SR501)"
              description="Passive Infrared (PIR) motion sensor for detecting movement"
              icon={<Wifi className="h-8 w-8 text-green-500" />}
              status={sensorStatusObj.motion}
              data={sensorData?.sensors.motion}
              lastUpdated={sensorData?.timestamp}
              specs={[
                { label: "Detection Range", value: "7 meters" },
                { label: "Detection Angle", value: "110°" },
                { label: "Trigger Mode", value: "Repeatable" },
                { label: "Power Supply", value: "5V DC" },
              ]}
            />
          </TabsContent>

          <TabsContent value="sound">
            <DetailedSensorView
              title="Sound Sensor"
              description="Microphone-based sound level detection sensor"
              icon={<Volume2 className="h-8 w-8 text-purple-500" />}
              status={sensorStatusObj.sound}
              data={sensorData?.sensors.sound}
              lastUpdated={sensorData?.timestamp}
              specs={[
                { label: "Sensitivity", value: "High" },
                { label: "Detection Range", value: "10 meters" },
                { label: "Frequency Range", value: "20Hz - 20kHz" },
                { label: "Power Supply", value: "3.3-5V DC" },
              ]}
            />
          </TabsContent>

          <TabsContent value="temperature">
            <DetailedSensorView
              title="Temperature Sensor (DHT11)"
              description="Digital temperature and humidity sensor"
              icon={<Thermometer className="h-8 w-8 text-red-500" />}
              status={sensorStatusObj.temperature}
              data={sensorData?.sensors.temperature}
              lastUpdated={sensorData?.timestamp}
              specs={[
                { label: "Range", value: "0-50°C" },
                { label: "Accuracy", value: "±2°C" },
                { label: "Resolution", value: "1°C" },
                { label: "Power Supply", value: "3.3-5V DC" },
              ]}
            />
          </TabsContent>

          <TabsContent value="humidity">
            <DetailedSensorView
              title="Humidity Sensor (DHT11)"
              description="Digital temperature and humidity sensor"
              icon={<Thermometer className="h-8 w-8 text-blue-500" />}
              status={sensorStatusObj.humidity}
              data={sensorData?.sensors.humidity}
              lastUpdated={sensorData?.timestamp}
              specs={[
                { label: "Range", value: "20-90% RH" },
                { label: "Accuracy", value: "±5% RH" },
                { label: "Resolution", value: "1% RH" },
                { label: "Power Supply", value: "3.3-5V DC" },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Sensor Card Component
function SensorCard({
  title,
  icon,
  status,
  value,
  lastUpdated,
}: {
  title: string
  icon: React.ReactNode
  status: boolean
  value: string
  lastUpdated?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={status ? "success" : "destructive"}>
            {status ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
            {status ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">{icon}</div>
          <div>
            <p className="text-2xl font-bold">{status ? value : "N/A"}</p>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Unknown"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Detailed Sensor View Component
function DetailedSensorView({
  title,
  description,
  icon,
  status,
  data,
  lastUpdated,
  specs,
}: {
  title: string
  description: string
  icon: React.ReactNode
  status: boolean
  data: any
  lastUpdated?: string
  specs: { label: string; value: string }[]
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">{icon}</div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={status ? "success" : "destructive"} className="ml-auto">
            {status ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
            {status ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium">Current Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data && status ? (
              Object.entries(data).map(([key, value]) => {
                if (key === "timestamp") return null
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key}</span>
                    <span className="font-medium">
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : typeof value === "number" && key === "value" && title.includes("Temperature")
                          ? `${value.toFixed(1)}°C`
                          : typeof value === "number" && key === "value" && title.includes("Humidity")
                            ? `${value.toFixed(1)}%`
                            : typeof value === "number" && key === "value" && title.includes("Sound")
                              ? `${value} dB`
                              : String(value)}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="col-span-2 text-center py-4 text-muted-foreground">
                Sensor is offline. No data available.
              </div>
            )}
          </div>
          {lastUpdated && status && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-medium">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {specs.map((spec, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{spec.label}</span>
                <span className="text-sm font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
