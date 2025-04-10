"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Download, FileImage, Search, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HistoryEvent {
  id: string
  type: "image" | "video" | "live" | "sensor"
  location: string
  timestamp: string
  crowdCount: number
  density: number
  anomalies: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<HistoryEvent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  useEffect(() => {
    // Simulate loading history data
    const timer = setTimeout(() => {
      // Generate mock history data
      const mockEvents: HistoryEvent[] = Array.from({ length: 20 }).map((_, i) => {
        const types = ["image", "video", "live", "sensor"] as const
        const locations = ["Uppal", "Bod Uppal", "Narapally", "Ghatkesar", "Miyapur", "Hitech City"]
        const daysAgo = i % 7
        const hoursAgo = i % 24

        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        date.setHours(date.getHours() - hoursAgo)

        return {
          id: `event-${i}`,
          type: types[i % types.length],
          location: locations[i % locations.length],
          timestamp: date.toISOString(),
          crowdCount: Math.floor(Math.random() * 200 + 50),
          density: Math.floor(Math.random() * 80 + 20),
          anomalies: Math.floor(Math.random() * 3),
        }
      })

      setEvents(mockEvents)
      setFilteredEvents(mockEvents)
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Filter events based on search query and active tab
    let filtered = events

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) => event.location.toLowerCase().includes(query) || event.id.toLowerCase().includes(query),
      )
    }

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((event) => event.type === activeTab)
    }

    setFilteredEvents(filtered)
  }, [searchQuery, activeTab, events])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ["ID", "Type", "Location", "Timestamp", "Crowd Count", "Density", "Anomalies"],
      ...filteredEvents.map((event) => [
        event.id,
        event.type,
        event.location,
        new Date(event.timestamp).toLocaleString(),
        event.crowdCount.toString(),
        `${event.density}%`,
        event.anomalies.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Create a blob and download
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `event-history-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "live":
        return <Video className="h-4 w-4 text-green-500" />
      case "sensor":
        return <Calendar className="h-4 w-4" />
      default:
        return <FileImage className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "image":
        return "Image"
      case "video":
        return "Video"
      case "live":
        return "Live Feed"
      case "sensor":
        return "Sensor Data"
      default:
        return type
    }
  }

  const viewEvent = (eventId: string) => {
    router.push(`/analysis?id=${eventId}`)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Event History</h1>
          </div>

          <Button variant="outline" onClick={handleExport} disabled={loading || filteredEvents.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export History
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Event Log</CardTitle>
            <CardDescription>View and search past analysis events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by location or ID..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>

              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="image">Images</TabsTrigger>
                  <TabsTrigger value="video">Videos</TabsTrigger>
                  <TabsTrigger value="live">Live</TabsTrigger>
                  <TabsTrigger value="sensor">Sensors</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>No events found</p>
                {searchQuery && (
                  <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 py-2 px-4 font-medium text-sm text-muted-foreground">
                  <div className="col-span-3">Date & Time</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-1 text-center">Count</div>
                  <div className="col-span-1 text-center">Density</div>
                  <div className="col-span-1 text-center">Anomalies</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-12 gap-4 py-3 px-4 rounded-md hover:bg-muted/50 items-center"
                  >
                    <div className="col-span-3 text-sm">{new Date(event.timestamp).toLocaleString()}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="flex w-fit items-center gap-1">
                        {getTypeIcon(event.type)}
                        <span>{getTypeLabel(event.type)}</span>
                      </Badge>
                    </div>
                    <div className="col-span-2 font-medium">{event.location}</div>
                    <div className="col-span-1 text-center">{event.crowdCount}</div>
                    <div className="col-span-1 text-center">{event.density}%</div>
                    <div className="col-span-1 text-center">
                      <Badge variant={event.anomalies > 0 ? "destructive" : "secondary"}>{event.anomalies}</Badge>
                    </div>
                    <div className="col-span-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => viewEvent(event.id)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
