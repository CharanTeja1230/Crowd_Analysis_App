"use client"

import Link from "next/link"
import { Bell, Settings, UploadCloud, User } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LocationSearch } from "@/components/location-search"
import { BackButton } from "@/components/back-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type NavbarProps = {
  currentLocation: string
  onLocationChange: (location: string) => void
  className?: string
  notifications: Array<{
    id: string
    message: string
    type: "alert" | "anomaly" | "prediction"
    time: string
    read?: boolean
  }>
  onShowUploadModal: () => void
}

export function Navbar({
  currentLocation,
  onLocationChange,
  className,
  notifications,
  onShowUploadModal,
}: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const hasUnreadNotifications = notifications.some((n) => !n.read)
  const showBackButton = pathname !== "/"

  return (
    <div className={cn("flex items-center justify-between p-4 border-b bg-background", className)}>
      <div className="flex items-center gap-2 md:gap-4">
        {showBackButton && <BackButton className="mr-2" />}

        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="hidden md:inline text-xl">Crowd Analysis</span>
        </Link>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onShowUploadModal}>
                <UploadCloud className="h-5 w-5" />
                <span className="sr-only">Upload</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload Image, Video or Connect Live Feed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <LocationSearch
          currentLocation={currentLocation}
          onLocationChange={onLocationChange}
          className="w-full max-w-[200px] md:max-w-[300px]"
        />
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {hasUnreadNotifications && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-2">
                  <span className="font-medium">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="w-full cursor-pointer">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/auth/login")}>
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />
      </div>
    </div>
  )
}

