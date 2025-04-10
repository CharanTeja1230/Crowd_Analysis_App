"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Download, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { hyderabadLocations } from "@/lib/sensor-types"

export default function OverviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("daily")

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  // Mock data for charts
  const [dailyData, setDailyData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      // Generate mock data
      const generateDailyData = () => {
        return Array.from({ length: 24 }).map((_, i) => ({
          hour: `${i}:00`,
          crowdCount: Math.floor(Math.random() * 200 + 50),
          density: Math.floor(Math.random() * 80 + 20),
          anomalies: Math.floor(Math.random() * 3),
        }))
      }

      const generateWeeklyData = () => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        return days.map((day) => ({
          day,
          crowdCount: Math.floor(Math.random() * 200 + 50),
          density: Math.floor(Math.random() * 80 + 20),
          anomalies: Math.floor(Math.random() * 3),
        }))
      }

      const generateMonthlyData = () => {
        return Array.from({ length: 30 }).map((_, i) => ({
          date: `Day ${i + 1}`,
          crowdCount: Math.floor(Math.random() * 200 + 50),
          density: Math.floor(Math.random() * 80 + 20),
          anomalies: Math.floor(Math.random() * 3),
        }))
      }

      setDailyData(generateDailyData())
      setWeeklyData(generateWeeklyData())
      setMonthlyData(generateMonthlyData())
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleExport = () => {
    // Determine which data to export based on active tab
    let data
    let filename

    switch (activeTab) {
      case "daily":
        data = dailyData
        filename = "daily-overview"
        break
      case "weekly":
        data = weeklyData
        filename = "weekly-overview"
        break
      case "monthly":
        data = monthlyData
        filename = "monthly-overview"
        break
      default:
        data = dailyData
        filename = "overview"
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
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    // Create a shareable link
    const shareUrl = `${window.location.origin}/overview?tab=${activeTab}`

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
            <h1 className="text-2xl font-bold">Overview</h1>
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
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Crowd Analytics Overview</CardTitle>
              </div>
              <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>Comprehensive view of crowd metrics across all locations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="h-[400px] border rounded-md p-4">
                <div className="text-center text-muted-foreground">
                  Chart visualization would go here, showing data for the {activeTab} view
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {hyderabadLocations.slice(0, 6).map((location) => (
            <Card key={location} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{location}</CardTitle>
                <CardDescription>
                  {activeTab === "daily"
                    ? "Today's metrics"
                    : activeTab === "weekly"
                      ? "This week's metrics"
                      : "This month's metrics"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <Skeleton className="h-[150px] w-full" />
                ) : (
                  <div className="h-[150px] bg-muted/20 p-4">
                    <div className="text-center text-muted-foreground">Location-specific chart would go here</div>
                  </div>
                )}
                <div className="grid grid-cols-3 divide-x">
                  <div className="p-3 text-center">
                    <div className="text-2xl font-bold">
                      {loading ? <Skeleton className="h-6 w-12 mx-auto" /> : Math.floor(Math.random() * 200 + 50)}
                    </div>
                    <div className="text-xs text-muted-foreground">Crowd</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-2xl font-bold">
                      {loading ? <Skeleton className="h-6 w-12 mx-auto" /> : `${Math.floor(Math.random() * 80 + 20)}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">Density</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-2xl font-bold">
                      {loading ? <Skeleton className="h-6 w-12 mx-auto" /> : Math.floor(Math.random() * 3)}
                    </div>
                    <div className="text-xs text-muted-foreground">Anomalies</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
