"use client"

import { useRouter } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud } from "lucide-react"

export default function AirQualitySensorPage() {
  const router = useRouter()

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold">Air Quality Sensor</h1>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              <CardTitle>Air Quality Sensor Data</CardTitle>
            </div>
            <CardDescription>Real-time air quality information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Air quality sensor data will be displayed here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
