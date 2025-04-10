"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Menu, Settings, Upload, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LocationSearch } from "@/components/location-search"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { getSensorStatus, generateMockSensorData } from "@/lib/sensor-types"

interface Notification {
  id: string
  message: string
  type: "alert" | "anomaly" | "prediction"
  time: string
  read: boolean
}

interface NavbarProps {
  currentLocation: string
  onLocationChange: (location: string) => void
  notifications?: Notification[]
  onShowUploadModal?: () => void
  sensorStatus?: "online" | "offline" | "warning"
}

export function Navbar({
  currentLocation,
  onLocationChange,
  notifications = [],
  onShowUploadModal,
  sensorStatus = "online",
}: NavbarProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Calculate unread notifications count
  useEffect(() => {
    const count = notifications.filter((notif) => !notif.read).length
    setUnreadCount(count)
  }, [notifications])

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem("user")
    // Redirect to login page
    router.push("/auth/login")
  }

  // Get sensor status object for mobile sidebar
  const sensorStatusObj = getSensorStatus(
    sensorStatus === "online" ? generateMockSensorData(currentLocation, true) : undefined,
  )

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar sensorStatus={sensorStatusObj} />
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden font-bold sm:inline-block">Crowd Analysis</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LocationSearch
            selectedLocation={currentLocation}
            onLocationChange={onLocationChange}
            className="hidden md:flex"
          />

          {/* Notification Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Link href="/notifications" className="text-xs text-primary hover:underline">
                  View All
                </Link>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3">
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="font-medium">{notification.message}</span>
                      {!notification.read && (
                        <Badge variant="secondary" className="ml-auto h-1.5 w-1.5 rounded-full p-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-3 text-center text-sm text-muted-foreground">No notifications</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark Mode Toggle */}
          <ModeToggle />

          {/* Upload Button */}
          {onShowUploadModal && (
            <Button variant="outline" size="icon" onClick={onShowUploadModal}>
              <Upload className="h-5 w-5" />
              <span className="sr-only">Upload</span>
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
