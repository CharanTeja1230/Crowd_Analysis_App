"use client"

import { motion } from "framer-motion"
import { Activity, AlertTriangle, Timer } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDensityColor, getDensityStatus } from "@/lib/locations"

interface DensityDisplayProps {
  location: string
  density: number
  trend: "increasing" | "decreasing" | "stable"
  lastUpdated: string
}

export function DensityDisplay({ location, density, trend, lastUpdated }: DensityDisplayProps) {
  const densityColor = getDensityColor(density)
  const densityStatus = getDensityStatus(density)

  const getIcon = () => {
    if (trend === "increasing") return <Activity className="h-5 w-5 text-red-500" />
    if (trend === "decreasing") return <Activity className="h-5 w-5 text-green-500" />
    return <Activity className="h-5 w-5 text-yellow-500" />
  }

  const getMessage = () => {
    if (trend === "increasing") return "Crowd density is increasing"
    if (trend === "decreasing") return "Crowd density is decreasing"
    return "Crowd density is stable"
  }

  // Calculate the animation values based on the density
  const progressAnimationProps = {
    width: `${density}%`,
    transition: { duration: 0.8, ease: "easeOut" },
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Density at {location}</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Timer className="h-4 w-4" />
            <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {getIcon()}
          <span>{getMessage()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">{densityStatus} Density</span>
            <span className="text-2xl font-bold">{density}%</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div className={`h-full ${densityColor}`} initial={{ width: 0 }} animate={progressAnimationProps} />
          </div>

          {density >= 80 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">High crowd density detected! Please exercise caution.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

