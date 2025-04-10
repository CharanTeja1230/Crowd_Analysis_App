"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bell,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Droplets,
  History,
  Home,
  Image,
  Layers,
  LineChart,
  LogOut,
  Settings,
  Thermometer,
  Upload,
  User,
  Users,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SidebarProps {
  className?: string
  sensorStatus?: {
    motion: boolean
    sound: boolean
    temperature: boolean
    humidity: boolean
  }
}

export function Sidebar({ className, sensorStatus }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sensorExpanded, setSensorExpanded] = useState(true)
  const [utilitiesExpanded, setUtilitiesExpanded] = useState(true)

  // Check if any sensors are online
  const anySensorOnline = sensorStatus && Object.values(sensorStatus).some((status) => status)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/",
      variant: "default",
    },
    {
      title: "Overview",
      icon: BarChart3,
      href: "/overview",
      variant: "ghost",
    },
    {
      title: "Anomalies",
      icon: Bell,
      href: "/anomalies",
      variant: "ghost",
    },
    {
      title: "Predictions",
      icon: LineChart,
      href: "/predictions",
      variant: "ghost",
    },
    {
      title: "Alerts",
      icon: Bell,
      href: "/alerts",
      variant: "ghost",
    },
    {
      title: "Event History",
      icon: History,
      href: "/history",
      variant: "ghost",
    },
  ]

  const sensorItems = [
    {
      title: "Motion",
      icon: Layers,
      href: "/sensors/motion",
      variant: "ghost",
      status: sensorStatus?.motion,
    },
    {
      title: "Sound",
      icon: Volume2,
      href: "/sensors/sound",
      variant: "ghost",
      status: sensorStatus?.sound,
    },
    {
      title: "Temperature",
      icon: Thermometer,
      href: "/sensors/temperature",
      variant: "ghost",
      status: sensorStatus?.temperature,
    },
    {
      title: "Humidity",
      icon: Droplets,
      href: "/sensors/humidity",
      variant: "ghost",
      status: sensorStatus?.humidity,
    },
    {
      title: "Air Quality",
      icon: Cloud,
      href: "/sensors/air",
      variant: "ghost",
      status: false,
    },
  ]

  const utilityItems = [
    {
      title: "Media",
      icon: Image,
      href: "/media",
      variant: "ghost",
    },
    {
      title: "Live Feed",
      icon: Camera,
      href: "/live",
      variant: "ghost",
    },
    {
      title: "Calendar",
      icon: Calendar,
      href: "/calendar",
      variant: "ghost",
    },
    {
      title: "Upload",
      icon: Upload,
      href: "/upload",
      variant: "ghost",
    },
    {
      title: "Profile",
      icon: User,
      href: "/profile",
      variant: "ghost",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
      variant: "ghost",
    },
  ]

  return (
    <TooltipProvider>
      <div className={cn("relative z-30", className)}>
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r bg-background transition-all duration-300",
            collapsed ? "w-16" : "w-64",
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Users className="h-6 w-6" />
                <span>Crowd Analysis</span>
              </Link>
            )}
            {collapsed && (
              <div className="mx-auto">
                <Users className="h-6 w-6" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-4 top-7 hidden h-8 w-8 rounded-full border bg-background md:flex"
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                          pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                          collapsed ? "justify-center" : "",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                  </Tooltip>
                ))}
              </div>

              <Separator />

              {/* Sensors Section with Collapsible */}
              <div className="space-y-1">
                {collapsed ? (
                  <>
                    <h4 className="mb-1 px-2 text-xs font-semibold text-center">{/* Empty for collapsed view */}</h4>
                    {sensorItems.map((item) => (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                              pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                              "justify-center",
                            )}
                          >
                            <div className="relative">
                              <item.icon className="h-5 w-5" />
                              <div
                                className={cn(
                                  "absolute -right-1 -top-1 h-2 w-2 rounded-full",
                                  item.status ? "bg-green-500" : "bg-red-500",
                                )}
                              />
                            </div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.title} - {item.status ? "Online" : "Offline"}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </>
                ) : (
                  <Collapsible open={sensorExpanded} onOpenChange={setSensorExpanded} className="w-full space-y-1">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-xs font-semibold">Sensors</h4>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ChevronRight className={cn("h-4 w-4 transition-transform", sensorExpanded && "rotate-90")} />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-1">
                      {sensorItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                          )}
                        >
                          <div className="relative">
                            <item.icon className="h-5 w-5" />
                            <div
                              className={cn(
                                "absolute -right-1 -top-1 h-2 w-2 rounded-full",
                                item.status ? "bg-green-500" : "bg-red-500",
                              )}
                            />
                          </div>
                          <span>{item.title}</span>
                          <div className="ml-auto">
                            {item.status ? (
                              <Wifi className="h-4 w-4 text-green-500" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>

              <Separator />

              {/* Utilities Section with Collapsible */}
              <div className="space-y-1">
                {collapsed ? (
                  <>
                    <h4 className="mb-1 px-2 text-xs font-semibold text-center">{/* Empty for collapsed view */}</h4>
                    {utilityItems.map((item) => (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                              pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                              "justify-center",
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    ))}
                  </>
                ) : (
                  <Collapsible
                    open={utilitiesExpanded}
                    onOpenChange={setUtilitiesExpanded}
                    className="w-full space-y-1"
                  >
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-xs font-semibold">Utilities</h4>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ChevronRight
                            className={cn("h-4 w-4 transition-transform", utilitiesExpanded && "rotate-90")}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-1">
                      {utilityItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="border-t p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/auth/login"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    collapsed ? "justify-center" : "",
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  {!collapsed && <span>Logout</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Logout</TooltipContent>}
            </Tooltip>
          </div>
        </div>
        {/* Add a spacer div to prevent content from being hidden behind the sidebar */}
        <div className={cn("transition-all duration-300", collapsed ? "w-16" : "w-64")} />
      </div>
    </TooltipProvider>
  )
}
