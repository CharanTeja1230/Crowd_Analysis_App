"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Download, Search, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { hyderabadLocations } from "@/lib/sensor-types"

interface Anomaly {
  id: string
  type: "crowd_surge" | "noise_spike" | "rapid_dispersal" | "unusual_pattern"
  location: string
  timestamp: string
  severity: "low" | "medium" | "high"
  description: string
  resolved: boolean
}

export default function AnomaliesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [filteredAnomalies, setFilteredAnomalies] = useState<Anomaly[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [severityFilter, setStatusFilter] = useState<string>("all")

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  useEffect(() => {
    // Simulate loading anomalies data
    const timer = setTimeout(() => {
      // Generate mock anomalies
      const types = ["crowd_surge", "noise_spike", "rapid_dispersal", "unusual_pattern"] as const
      const severities = ["low", "medium", "high"] as const

      const mockAnomalies: Anomaly[] = Array.from({ length: 20 }).map((_, i) => {
        const daysAgo = i % 7
        const hoursAgo = i % 24

        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        date.setHours(date.getHours() - hoursAgo)

        const type = types[i % types.length]
        const location = hyderabadLocations[i % hyderabadLocations.length]
        const severity = severities[Math.floor(Math.random() * severities.length)]

        let description = ""
        switch (type) {
          case "crowd_surge":
            description = `Sudden increase in crowd density detected at ${location}`
            break
          case "noise_spike":
            description = `Abnormal noise levels detected at ${location}`
            break
          case "rapid_dispersal":
            description = `Rapid crowd dispersal detected at ${location}`
            break
          case "unusual_pattern":
            description = `Unusual crowd movement pattern detected at ${location}`
            break
        }

        return {
          id: `anomaly-${i}`,
          type,
          location,
          timestamp: date.toISOString(),
          severity,
          description,
          resolved: Math.random() > 0.7,
        }
      })

      setAnomalies(mockAnomalies)
      setFilteredAnomalies(mockAnomalies)
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Filter anomalies based on search query and filters
    let filtered = anomalies

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (anomaly) =>
          anomaly.location.toLowerCase().includes(query) ||
          anomaly.description.toLowerCase().includes(query) ||
          anomaly.type.toLowerCase().includes(query),
      )
    }

    // Filter by location
    if (locationFilter !== "all") {
      filtered = filtered.filter((anomaly) => anomaly.location === locationFilter)
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((anomaly) => anomaly.type === typeFilter)
    }

    // Filter by severity
    if (severityFilter !== "all") {
      filtered = filtered.filter((anomaly) => anomaly.severity === severityFilter)
    }

    setFilteredAnomalies(filtered)
  }, [searchQuery, locationFilter, typeFilter, severityFilter, anomalies])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ["ID", "Type", "Location", "Timestamp", "Severity", "Description", "Resolved"],
      ...filteredAnomalies.map((anomaly) => [
        anomaly.id,
        anomaly.type,
        anomaly.location,
        new Date(anomaly.timestamp).toLocaleString(),
        anomaly.severity,
        anomaly.description,
        anomaly.resolved ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Create a blob and download
    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `anomalies-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "crowd_surge":
        return "Crowd Surge"
      case "noise_spike":
        return "Noise Spike"
      case "rapid_dispersal":
        return "Rapid Dispersal"
      case "unusual_pattern":
        return "Unusual Pattern"
      default:
        return type
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-yellow-500"
      case "medium":
        return "bg-orange-500"
      case "high":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const viewAnomalyDetails = (anomalyId: string) => {
    router.push(`/anomalies/${anomalyId}`)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Anomalies</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={loading || filteredAnomalies.length === 0}>
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
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle>Anomaly Detection</CardTitle>
              </div>
              <Badge variant="outline">{filteredAnomalies.length} anomalies found</Badge>
            </div>
            <CardDescription>Unusual crowd behavior and environmental anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search anomalies..." className="pl-8" value={searchQuery} onChange={handleSearch} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {hyderabadLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="crowd_surge">Crowd Surge</SelectItem>
                    <SelectItem value="noise_spike">Noise Spike</SelectItem>
                    <SelectItem value="rapid_dispersal">Rapid Dispersal</SelectItem>
                    <SelectItem value="unusual_pattern">Unusual Pattern</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredAnomalies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>No anomalies found</p>
                {(searchQuery || locationFilter !== "all" || typeFilter !== "all" || severityFilter !== "all") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("")
                      setLocationFilter("all")
                      setTypeFilter("all")
                      setStatusFilter("all")
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnomalies.map((anomaly) => (
                  <Alert
                    key={anomaly.id}
                    variant={anomaly.severity === "high" ? "destructive" : "default"}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => viewAnomalyDetails(anomaly.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <div className={`h-2 w-2 rounded-full ${getSeverityColor(anomaly.severity)}`}></div>
                          {getTypeLabel(anomaly.type)}
                          {anomaly.resolved && (
                            <Badge variant="outline" className="ml-2">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <AlertDescription className="mt-1">{anomaly.description}</AlertDescription>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Location: {anomaly.location}</span>
                          <span>Time: {new Date(anomaly.timestamp).toLocaleString()}</span>
                          <span>Severity: {anomaly.severity}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
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
