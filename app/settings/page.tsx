"use client"

import { useRouter } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export default function SettingsPage() {
  const router = useRouter()

  // Mock sensor status
  const sensorStatus = {
    motion: true,
    sound: true,
    temperature: true,
    humidity: false,
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sensorStatus={sensorStatus} />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>Application Settings</CardTitle>
            </div>
            <CardDescription>Configure your application preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="sensors">Sensors</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch id="dark-mode" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-refresh">Auto Refresh Data</Label>
                  <Switch id="auto-refresh" defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Slider defaultValue={[30]} max={120} step={5} />
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch id="email-notifications" />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch id="push-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="anomaly-alerts">Anomaly Alerts</Label>
                  <Switch id="anomaly-alerts" defaultChecked />
                </div>
              </TabsContent>

              <TabsContent value="sensors" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="motion-sensor">Motion Sensor</Label>
                  <Switch id="motion-sensor" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-sensor">Sound Sensor</Label>
                  <Switch id="sound-sensor" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature-sensor">Temperature Sensor</Label>
                  <Switch id="temperature-sensor" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="humidity-sensor">Humidity Sensor</Label>
                  <Switch id="humidity-sensor" defaultChecked />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
