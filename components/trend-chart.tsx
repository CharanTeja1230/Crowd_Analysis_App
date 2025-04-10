"use client"

import { useState, useEffect } from "react"
import { HistoryIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TrendChartProps {
  location: string
}

export function TrendChart({ location }: TrendChartProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("hour")
  const [data, setData] = useState<Record<string, any[]>>({
    hour: [],
    day: [],
    week: [],
    month: [],
  })

  useEffect(() => {
    // Simulate loading data
    setLoading(true)

    const timer = setTimeout(() => {
      setLoading(false)

      // Generate hourly data (last 12 hours)
      const hourData = Array.from({ length: 12 }).map((_, i) => {
        const hour = new Date()
        hour.setHours(hour.getHours() - (11 - i))
        return {
          time: hour.getHours() + ":00",
          density: 20 + Math.floor(Math.random() * 60),
          sound: 30 + Math.floor(Math.random() * 40),
        }
      })

      // Generate daily data (last 7 days)
      const dayData = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date()
        day.setDate(day.getDate() - (6 - i))
        return {
          time: day.toLocaleDateString(undefined, { weekday: "short" }),
          density: 30 + Math.floor(Math.random() * 50),
          sound: 30 + Math.floor(Math.random() * 40),
        }
      })

      // Generate weekly data (last 4 weeks)
      const weekData = Array.from({ length: 4 }).map((_, i) => {
        return {
          time: `Week ${i + 1}`,
          density: 40 + Math.floor(Math.random() * 40),
          sound: 30 + Math.floor(Math.random() * 40),
        }
      })

      // Generate monthly data (last 6 months)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const currentMonth = new Date().getMonth()
      const monthData = Array.from({ length: 6 }).map((_, i) => {
        const monthIndex = (currentMonth - 5 + i + 12) % 12
        return {
          time: monthNames[monthIndex],
          density: 30 + Math.floor(Math.random() * 50),
          sound: 30 + Math.floor(Math.random() * 40),
        }
      })

      setData({
        hour: hourData,
        day: dayData,
        week: weekData,
        month: monthData,
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, [location])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Density Trends</CardTitle>
          <Tabs defaultValue="hour" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="hour" className="text-xs">
                Hour
              </TabsTrigger>
              <TabsTrigger value="day" className="text-xs">
                Day
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs">
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription className="flex items-center gap-1">
          <HistoryIcon className="h-3 w-3" />
          <span>Historical crowd data at {location}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <Tabs defaultValue="hour" value={activeTab} onValueChange={handleTabChange} className="hidden">
            <TabsContent value="hour" className="mt-0">
              <ChartContainer
                className="h-[200px]"
                config={{
                  density: {
                    label: "Density",
                    color: "hsl(var(--chart-1))",
                  },
                  sound: {
                    label: "Sound Level",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.hour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="density" stroke="var(--color-density)" strokeWidth={2} />
                    <Line type="monotone" dataKey="sound" stroke="var(--color-sound)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>

            <TabsContent value="day" className="mt-0">
              <ChartContainer
                className="h-[200px]"
                config={{
                  density: {
                    label: "Density",
                    color: "hsl(var(--chart-1))",
                  },
                  sound: {
                    label: "Sound Level",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.day}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="density" stroke="var(--color-density)" strokeWidth={2} />
                    <Line type="monotone" dataKey="sound" stroke="var(--color-sound)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>

            <TabsContent value="week" className="mt-0">
              <ChartContainer
                className="h-[200px]"
                config={{
                  density: {
                    label: "Density",
                    color: "hsl(var(--chart-1))",
                  },
                  sound: {
                    label: "Sound Level",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.week}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="density" stroke="var(--color-density)" strokeWidth={2} />
                    <Line type="monotone" dataKey="sound" stroke="var(--color-sound)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>

            <TabsContent value="month" className="mt-0">
              <ChartContainer
                className="h-[200px]"
                config={{
                  density: {
                    label: "Density",
                    color: "hsl(var(--chart-1))",
                  },
                  sound: {
                    label: "Sound Level",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.month}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="density" stroke="var(--color-density)" strokeWidth={2} />
                    <Line type="monotone" dataKey="sound" stroke="var(--color-sound)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        )}

        {!loading && (
          <ChartContainer
            className="h-[200px]"
            config={{
              density: {
                label: "Density",
                color: "hsl(var(--chart-1))",
              },
              sound: {
                label: "Sound Level",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data[activeTab]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="density" stroke="var(--color-density)" strokeWidth={2} />
                <Line type="monotone" dataKey="sound" stroke="var(--color-sound)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
