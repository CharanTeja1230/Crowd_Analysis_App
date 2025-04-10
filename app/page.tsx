"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { DensityDisplay } from "@/components/density-display"
import { EnhancedSensorPanel } from "@/components/enhanced-sensor-panel"
import { EnhancedHeatMap } from "@/components/enhanced-heat-map"
import { AnomalyDetector } from "@/components/anomaly-detector"
import { Predictions } from "@/components/predictions"
import { TrendChart } from "@/components/trend-chart"
import { UploadModal } from "@/components/upload-modal"
import { getLocationData, hyderabadLocations, getSensorStatus, generateMockSensorData } from "@/lib/sensor-types"
import { Sidebar } from "@/components/sidebar"

// Key for storing sensor status in localStorage
const SENSOR_STATUS_KEY = "crowd_analysis_sensor_status"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locationParam = searchParams.get("location")

  // Get initial location from URL or default to first location
  const initialLocation = locationParam
    ? hyderabadLocations.find((loc) => loc.toLowerCase() === locationParam.toLowerCase()) || hyderabadLocations[0]
    : hyderabadLocations[0]

  const [currentLocation, setCurrentLocation] = useState(initialLocation)
  const [locationData, setLocationData] = useState(getLocationData())
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [sensorStatus, setSensorStatus] = useState<"online" | "offline" | "warning">("offline")
  const [mediaSource, setMediaSource] = useState<"live" | "image" | "video" | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      message: `High density detected at Hitech City`,
      type: "alert" as const,
      time: "10 minutes ago",
      read: false,
    },
    {
      id: "notif-2",
      message: `Unusual noise levels at ${currentLocation}`,
      type: "anomaly" as const,
      time: "30 minutes ago",
      read: false,
    },
    {
      id: "notif-3",
      message: `Prediction: High crowd expected at Miyapur by 5 PM`,
      type: "prediction" as const,
      time: "1 hour ago",
      read: true,
    },
  ])

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      // Check if user is logged in
      const user = localStorage.getItem("user")
      if (!user) {
        // Redirect to login page
        router.push("/auth/login")
      } else {
        setIsAuthenticated(true)
      }
      setCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  // Load persisted sensor status on component mount
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem(SENSOR_STATUS_KEY)
      if (savedStatus) {
        setSensorStatus(savedStatus as "online" | "offline" | "warning")
      }
    } catch (err) {
      console.error("Error loading sensor status:", err)
    }
  }, [])

  // Update data periodically for simulation
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      setLocationData(getLocationData())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Handle sensor status change
  const handleSensorStatusChange = (status: "online" | "offline" | "warning") => {
    setSensorStatus(status)

    // Persist sensor status to localStorage
    try {
      localStorage.setItem(SENSOR_STATUS_KEY, status)
    } catch (err) {
      console.error("Error saving sensor status:", err)
    }

    // If sensors go offline, clear media source if it's live
    if (status === "offline" && mediaSource === "live") {
      setMediaSource(null)
    }
  }

  // Handle media upload completion
  const handleMediaUpload = (type: "image" | "video" | "live", location?: string) => {
    setMediaSource(type)
    setShowUploadModal(false)

    // Update location if provided
    if (location) {
      setCurrentLocation(location)

      // Update URL
      const url = new URL(window.location.href)
      url.searchParams.set("location", location)
      router.replace(url.pathname + url.search)
    }

    // For live feed, redirect to live page
    if (type === "live") {
      router.push(`/live?location=${encodeURIComponent(location || currentLocation)}`)
    }
  }

  // Get sensor status object
  const sensorStatusObj = getSensorStatus(
    sensorStatus === "online" ? generateMockSensorData(currentLocation, true) : undefined,
  )

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Only render dashboard if authenticated
  if (!isAuthenticated) {
    return null // Router will redirect to login
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatusObj} />

      <div className="flex-1 flex flex-col">
        <Navbar
          currentLocation={currentLocation}
          onLocationChange={setCurrentLocation}
          notifications={notifications}
          onShowUploadModal={() => setShowUploadModal(true)}
          sensorStatus={sensorStatus}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <DensityDisplay location={currentLocation} sensorStatus={sensorStatus} />
              </div>
              <div>
                <EnhancedSensorPanel
                  location={currentLocation}
                  sensorStatus={sensorStatus}
                  onSensorStatusChange={handleSensorStatusChange}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <EnhancedHeatMap location={currentLocation} sensorStatus={sensorStatus} mediaSource={mediaSource} />
              <TrendChart location={currentLocation} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <AnomalyDetector location={currentLocation} sensorStatus={sensorStatus} />
              <Predictions location={currentLocation} sensorStatus={sensorStatus} />
            </div>
          </div>
        </main>

        <UploadModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onUploadComplete={handleMediaUpload}
          sensorStatus={sensorStatus}
          currentLocation={currentLocation}
          onSensorStatusChange={handleSensorStatusChange}
        />
      </div>
    </div>
  )
}
