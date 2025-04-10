"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Bell, Download, Search, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { hyderabadLocations } from "@/lib/sensor-types"

interface AlertItem {
  id: string
  type: "density" | "anomaly" | "sensor" | "prediction"
  location: string
  timestamp: string
  message: string
  read: boolean
  acknowledged: boolean
}

export default function AlertsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showRead, setShowRead] = useState(false)

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  useEffect(() => {
    // Simulate loading alerts data
    const timer = setTimeout(() => {
      // Generate mock alerts
      const types = ["density", "anomaly", "sensor", "prediction"] as const

      const mockAlerts: AlertItem[] = Array.from({ length: 20 }).map((_, i) => {
        const daysAgo = i % 7
        const hoursAgo = i % 24

        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        date.setHours(date.getHours() - hoursAgo)

        const type = types[i % types.length]
        const location = hyderabadLocations[i % hyderabadLocations.length]

        let message = ""
        switch (type) {
          case "density":
            message = `High crowd density detected at ${location}. Current density: ${Math.floor(Math.random() * 20 + 80)}%`
            break
          case "anomaly":
            message = `Unusual crowd behavior detected at ${location}. Possible crowd surge.`
            break
          case "sensor":
            message = `Sensor offline at ${location}. Please check the connection.`
            break
          case "prediction":
            message = `High crowd density predicted at ${location} in the next hour.`
            break
        }

        return {
          id: `alert-${i}`,
          type,
          location,
          timestamp: date.toISOString(),
          message,
          read: Math.random() > 0.5,
          acknowledged: Math.random() > 0.7,
        }
      })

      setAlerts(mockAlerts)
      setFilteredAlerts(mockAlerts.filter((alert) => !alert.read || showRead))
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [showRead])

  useEffect(() => {
    // Filter alerts based on search query and showRead setting
    let filtered = alerts

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (alert) =>
          alert.location.toLowerCase().includes(query) ||
          alert.message.toLowerCase().includes(query) ||
          alert.type.toLowerCase().includes(query),
      )
    }

    // Filter by read status
    if (!showRead) {
      filtered = filtered.filter((alert) => !alert.read)
    }

    setFilteredAlerts(filtered)
  }, [searchQuery, showRead, alerts])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleToggleRead = () => {
    setShowRead(!showRead)
  }

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ["ID", "Type", "Location", "Timestamp", "Message", "Read", "Acknowledged"],
      ...filteredAlerts.map((alert) => [
        alert.id,
        alert.type,
        alert.location,
        new Date(alert.timestamp).toLocaleString(),
        alert.message,
        alert.read ? "Yes" : "No",
        alert.acknowledged ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Create a blob and download
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `alerts-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "density":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "anomaly":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "sensor":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case "prediction":
        return <Bell className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "density":
        return "Density Alert"
      case "anomaly":
        return "Anomaly Alert"
      case "sensor":
        return "Sensor Alert"
      case "prediction":
        return "Prediction Alert"
      default:
        return type
    }
  }

  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, read: true } : alert)))
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Alerts</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={loading || filteredAlerts.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" />
                <CardTitle>Alert Center</CardTitle>
              </div>
              <Badge variant="outline">{filteredAlerts.length} alerts</Badge>
            </div>
            <CardDescription>System alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search alerts..." className="pl-8" value={searchQuery} onChange={handleSearch} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="show-read" checked={showRead} onCheckedChange={handleToggleRead} />
                <Label htmlFor="show-read">Show read alerts</Label>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>No alerts found</p>
                {searchQuery && (
                  <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                    Clear search
                  </Button>
                )}
                {!showRead && alerts.some((alert) => alert.read) && (
                  <Button variant="link" onClick={() => setShowRead(true)} className="mt-2">
                    Show read alerts
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={alert.read ? "default" : "destructive"}
                    className={`${alert.read ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {getTypeIcon(alert.type)}
                          {getTypeLabel(alert.type)}
                          {!alert.read && (
                            <Badge variant="default" className="ml-2">
                              New
                            </Badge>
                          )}
                        </div>
                        <AlertDescription className="mt-1">{alert.message}</AlertDescription>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Location: {alert.location}</span>
                          <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                          {alert.acknowledged && <span>Acknowledged</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!alert.read && (
                          <Button variant="outline" size="sm" onClick={() => markAsRead(alert.id)}>
                            Mark as Read
                          </Button>
                        )}
                        {!alert.acknowledged && (
                          <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
