"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, Filter, Search, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { BackButton } from "@/components/back-button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Notification {
  id: string
  message: string
  type: "alert" | "anomaly" | "prediction" | "system"
  time: string
  read: boolean
  location?: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

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

  // Load notifications
  useEffect(() => {
    if (!isAuthenticated) return

    setIsLoading(true)

    // Generate mock notifications
    const mockNotifications: Notification[] = [
      {
        id: "notif-1",
        message: "High crowd density detected at Hitech City",
        type: "alert",
        time: "10 minutes ago",
        read: false,
        location: "Hitech City",
      },
      {
        id: "notif-2",
        message: "Unusual noise levels detected at Uppal",
        type: "anomaly",
        time: "30 minutes ago",
        read: false,
        location: "Uppal",
      },
      {
        id: "notif-3",
        message: "Prediction: High crowd expected at Miyapur by 5 PM",
        type: "prediction",
        time: "1 hour ago",
        read: true,
        location: "Miyapur",
      },
      {
        id: "notif-4",
        message: "Temperature sensor offline at Kukatpally",
        type: "system",
        time: "2 hours ago",
        read: true,
        location: "Kukatpally",
      },
      {
        id: "notif-5",
        message: "Rapid crowd dispersal detected at LB Nagar",
        type: "anomaly",
        time: "3 hours ago",
        read: false,
        location: "LB Nagar",
      },
      {
        id: "notif-6",
        message: "System update completed successfully",
        type: "system",
        time: "5 hours ago",
        read: true,
      },
      {
        id: "notif-7",
        message: "Unusual crowd behavior detected at Ameerpet",
        type: "anomaly",
        time: "Yesterday",
        read: true,
        location: "Ameerpet",
      },
      {
        id: "notif-8",
        message: "Prediction: Low crowd expected at Dilsukhnagar tomorrow",
        type: "prediction",
        time: "Yesterday",
        read: true,
        location: "Dilsukhnagar",
      },
    ]

    // Simulate network delay
    setTimeout(() => {
      setNotifications(mockNotifications)
      setFilteredNotifications(mockNotifications)
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated])

  // Filter notifications based on search query and active tab
  useEffect(() => {
    if (!notifications.length) return

    let filtered = notifications

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification.message.toLowerCase().includes(query) ||
          (notification.location && notification.location.toLowerCase().includes(query)),
      )
    }

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((notification) => notification.type === activeTab)
    }

    setFilteredNotifications(filtered)
  }, [searchQuery, activeTab, notifications])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications((prev) => (prev.includes(id) ? prev.filter((notifId) => notifId !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map((notification) => notification.id))
    }
  }

  const handleMarkAsRead = () => {
    setActionInProgress("markAsRead")

    // Simulate network delay
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((notification) =>
          selectedNotifications.includes(notification.id) ? { ...notification, read: true } : notification,
        ),
      )
      setSelectedNotifications([])
      setActionInProgress(null)
    }, 800)
  }

  const handleDelete = () => {
    setActionInProgress("delete")

    // Simulate network delay
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => !selectedNotifications.includes(notification.id)))
      setSelectedNotifications([])
      setActionInProgress(null)
    }, 800)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "alert":
        return "Alert"
      case "anomaly":
        return "Anomaly"
      case "prediction":
        return "Prediction"
      case "system":
        return "System"
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "alert":
        return "bg-red-500"
      case "anomaly":
        return "bg-orange-500"
      case "prediction":
        return "bg-blue-500"
      case "system":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

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

  // Only render page if authenticated
  if (!isAuthenticated) {
    return null // Router will redirect to login
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              disabled={selectedNotifications.length === 0 || actionInProgress !== null}
              isLoading={actionInProgress === "markAsRead"}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark as Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={selectedNotifications.length === 0 || actionInProgress !== null}
              isLoading={actionInProgress === "delete"}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>All Notifications</CardTitle>
              </div>
              <Badge variant="outline">{filteredNotifications.length} notifications</Badge>
            </div>
            <CardDescription>View and manage your notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>

              <div className="flex items-center gap-2">
                <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="alert">Alerts</TabsTrigger>
                    <TabsTrigger value="anomaly">Anomalies</TabsTrigger>
                    <TabsTrigger value="prediction">Predictions</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Select defaultValue="newest">
                  <SelectTrigger className="w-[120px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 w-full animate-pulse rounded-md bg-muted"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center py-2 px-4">
                  <Checkbox
                    id="select-all"
                    checked={
                      filteredNotifications.length > 0 && selectedNotifications.length === filteredNotifications.length
                    }
                    onCheckedChange={handleSelectAll}
                    className="mr-2"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All
                  </label>
                </div>

                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 text-muted-foreground/50" />
                    <p>No notifications found</p>
                    {searchQuery && (
                      <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-3 rounded-md p-3 transition-colors ${
                          notification.read ? "bg-background" : "bg-muted/50"
                        } hover:bg-muted`}
                      >
                        <Checkbox
                          id={`select-${notification.id}`}
                          checked={selectedNotifications.includes(notification.id)}
                          onCheckedChange={() => handleSelectNotification(notification.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`h-2 w-2 rounded-full ${getTypeColor(notification.type)}`}></div>
                            <span className="text-sm font-medium">{getTypeLabel(notification.type)}</span>
                            {!notification.read && (
                              <Badge variant="default" className="ml-2 h-5 px-1">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{notification.message}</p>
                          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{notification.time}</span>
                            {notification.location && <span>Location: {notification.location}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
                              )
                            }}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
                            }}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
