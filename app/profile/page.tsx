"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Save, Trash, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/sidebar"

interface UserProfile {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  })

  // Simulate fetching user profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)

      // In a real app, fetch from API
      // const response = await fetch('/api/profile');
      // const data = await response.json();

      // For demo, use mock data
      setTimeout(() => {
        setProfile({
          id: "1",
          username: "demo_user",
          email: "demo@example.com",
          role: "user",
          createdAt: new Date().toISOString(),
        })

        setFormData({
          username: "demo_user",
          email: "demo@example.com",
        })

        setLoading(false)
      }, 1000)
    }

    fetchProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    // In a real app, send to API
    // await fetch('/api/profile', {
    //   method: 'PUT',
    //   body: JSON.stringify(formData)
    // });

    // For demo, just update local state
    setProfile((prev) => {
      if (!prev) return null
      return {
        ...prev,
        username: formData.username,
        email: formData.email,
      }
    })

    setEditing(false)
  }

  const goBack = () => {
    router.back()
  }

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
          <Button variant="outline" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-1/3 animate-pulse rounded-md bg-muted"></div>
            <div className="h-64 animate-pulse rounded-md bg-muted"></div>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="sensors">Sensor Config</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>{profile?.username}</CardTitle>
                    <CardDescription>{profile?.email}</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" className="ml-auto" onClick={() => setEditing(!editing)}>
                    {editing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                  {editing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" name="username" value={formData.username} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                          <p>{profile?.username}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                          <p>{profile?.email}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                          <p className="capitalize">{profile?.role}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                          <p>{new Date(profile?.createdAt || "").toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between">
                  {editing ? (
                    <>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>Save Changes</Button>
                    </>
                  ) : (
                    <Button variant="destructive" className="ml-auto">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select id="language" className="w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="te">Telugu</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifications">Notification Preferences</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="email-notifications" className="h-4 w-4" defaultChecked />
                        <label htmlFor="email-notifications">Email Notifications</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="push-notifications" className="h-4 w-4" defaultChecked />
                        <label htmlFor="push-notifications">Push Notifications</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="sms-notifications" className="h-4 w-4" />
                        <label htmlFor="sms-notifications">SMS Notifications</label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="sensors">
              <Card>
                <CardHeader>
                  <CardTitle>Sensor Configuration</CardTitle>
                  <CardDescription>Manage your IoT sensors and thresholds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Motion Sensor (HC-SR501)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="motion-sensitivity" className="text-xs">
                          Sensitivity
                        </Label>
                        <Input
                          id="motion-sensitivity"
                          type="range"
                          min="0"
                          max="100"
                          defaultValue="70"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="motion-delay" className="text-xs">
                          Delay (seconds)
                        </Label>
                        <Input id="motion-delay" type="number" min="1" max="60" defaultValue="5" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Sound Sensor</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sound-threshold" className="text-xs">
                          Threshold (dB)
                        </Label>
                        <Input id="sound-threshold" type="number" min="0" max="120" defaultValue="70" />
                      </div>
                      <div>
                        <Label htmlFor="sound-sampling" className="text-xs">
                          Sampling Rate (Hz)
                        </Label>
                        <Input id="sound-sampling" type="number" min="1" max="100" defaultValue="10" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Temperature & Humidity (DHT11)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="temp-unit" className="text-xs">
                          Temperature Unit
                        </Label>
                        <select
                          id="temp-unit"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                        >
                          <option value="C">Celsius</option>
                          <option value="F">Fahrenheit</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="reading-interval" className="text-xs">
                          Reading Interval (seconds)
                        </Label>
                        <Input id="reading-interval" type="number" min="1" max="300" defaultValue="5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Configuration</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
