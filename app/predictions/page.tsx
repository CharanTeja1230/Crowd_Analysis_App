"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Download, LineChart, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { hyderabadLocations } from "@/lib/sensor-types"

export default function PredictionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("hourly")
  const [selectedLocation, setSelectedLocation] = useState(hyderabadLocations[0])

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  // Mock prediction data
  const [hourlyData, setHourlyData] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      // Generate mock prediction data
      const generateHourlyData = () => {
        return Array.from({ length: 24 }).map((_, i) => {
          const hour = new Date()
          hour.setHours(hour.getHours() + i)
          return {
            time: hour.getHours() + ":00",
            crowdCount: Math.floor(Math.random() * 200 + 50),
            density: Math.floor(Math.random() * 80 + 20),
            confidence: Math.floor(Math.random() * 30 + 70),
          }
        })
      }

      const generateDailyData = () => {
        return Array.from({ length: 7 }).map((_, i) => {
          const day = new Date()
          day.setDate(day.getDate() + i)
          return {
            day: day.toLocaleDateString("en-US", { weekday: "short" }),
            date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            crowdCount: Math.floor(Math.random() * 200 + 50),
            density: Math.floor(Math.random() * 80 + 20),
            confidence: Math.floor(Math.random() * 30 + 70),
          }
        })
      }

      const generateWeeklyData = () => {
        return Array.from({ length: 4 }).map((_, i) => {
          const week = new Date()
          week.setDate(week.getDate() + i * 7)
          return {
            week: `Week ${i + 1}`,
            startDate: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            crowdCount: Math.floor(Math.random() * 200 + 50),
            density: Math.floor(Math.random() * 80 + 20),
            confidence: Math.floor(Math.random() * 30 + 70),
          }
        })
      }

      setHourlyData(generateHourlyData())
      setDailyData(generateDailyData())
      setWeeklyData(generateWeeklyData())
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [selectedLocation])

  const handleExport = () => {
    // Determine which data to export based on active tab
    let data
    let filename

    switch (activeTab) {
      case "hourly":
        data = hourlyData
        filename = "hourly-predictions"
        break
      case "daily":
        data = dailyData
        filename = "daily-predictions"
        break
      case "weekly":
        data = weeklyData
        filename = "weekly-predictions"
        break
      default:
        data = hourlyData
        filename = "predictions"
    }

    // Create CSV data
    const headers = Object.keys(data[0] || {})
    const csvData = [headers, ...data.map((row) => headers.map((header) => row[header]))]
      .map((row) => row.join(","))
      .join("\n")

    // Create a blob and download
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${selectedLocation}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    // Create a shareable link
    const shareUrl = `${window.location.origin}/predictions?tab=${activeTab}&location=${encodeURIComponent(selectedLocation)}`

    // Copy to clipboard
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert("Share link copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        alert("Failed to copy share link. Please try again.")
      })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Predictions</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                <CardTitle>Crowd Density Predictions</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {hyderabadLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tabs defaultValue="hourly" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="hourly">Hourly</TabsTrigger>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <CardDescription>AI-powered crowd density predictions for {selectedLocation}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="h-[400px] border rounded-md p-4">
                <div className="text-center text-muted-foreground">
                  Chart visualization would go here, showing prediction data for the {activeTab} view
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Peak Times</CardTitle>
              <CardDescription>Predicted high-density periods for {selectedLocation}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTab === "hourly" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Today, {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      {hourlyData.slice(0, 3).map((hour, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{hour.time}</div>
                            <div className="text-sm text-muted-foreground">
                              {hour.density}% density, {hour.crowdCount} people
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{hour.confidence}%</span> confidence
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "daily" && (
                    <div className="space-y-4">
                      {dailyData.slice(0, 3).map((day, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {day.day}, {day.date}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {day.density}% density, {day.crowdCount} people
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{day.confidence}%</span> confidence
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "weekly" && (
                    <div className="space-y-4">
                      {weeklyData.map((week, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {week.week} (starting {week.startDate})
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {week.density}% density, {week.crowdCount} people
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{week.confidence}%</span> confidence
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prediction Factors</CardTitle>
              <CardDescription>Key factors influencing crowd predictions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Historical Patterns</div>
                    <div className="text-sm">
                      <span className="font-medium">40%</span> influence
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Weather Conditions</div>
                    <div className="text-sm">
                      <span className="font-medium">25%</span> influence
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Events & Holidays</div>
                    <div className="text-sm">
                      <span className="font-medium">20%</span> influence
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Time of Day</div>
                    <div className="text-sm">
                      <span className="font-medium">10%</span> influence
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Other Factors</div>
                    <div className="text-sm">
                      <span className="font-medium">5%</span> influence
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
