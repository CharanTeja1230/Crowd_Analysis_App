export const hyderabadLocations = [
  "Uppal",
  "Bod Uppal",
  "Narapally",
  "Ghatkesar",
  "Miyapur",
  "Hitech City",
  "Kukatpally",
  "Ameerpet",
  "Dilsukhnagar",
  "LB Nagar",
  "Mehdipatnam",
]

export type LocationData = {
  id: string
  name: string
  currentDensity: number
  densityTrend: "increasing" | "decreasing" | "stable"
  anomalyCount: number
  sensorStatus: "online" | "offline" | "warning"
  lastUpdated: string
  bookmark: boolean
}

// Sample data for demonstration
export const getLocationData = (): Record<string, LocationData> => {
  const data: Record<string, LocationData> = {}

  hyderabadLocations.forEach((location, index) => {
    // Generate random data for demonstration
    const currentDensity = Math.floor(Math.random() * 100)
    const trends = ["increasing", "decreasing", "stable"] as const
    const statuses = ["online", "online", "online", "warning", "offline"] as const

    data[location.toLowerCase()] = {
      id: `loc-${index}`,
      name: location,
      currentDensity,
      densityTrend: trends[Math.floor(Math.random() * trends.length)],
      anomalyCount: Math.floor(Math.random() * 5),
      sensorStatus: statuses[Math.floor(Math.random() * statuses.length)],
      lastUpdated: new Date().toISOString(),
      bookmark: Math.random() > 0.7,
    }
  })

  return data
}

export const getDensityColor = (density: number) => {
  if (density < 40) return "bg-green-500"
  if (density < 80) return "bg-yellow-500"
  return "bg-red-500"
}

export const getDensityStatus = (density: number) => {
  if (density < 40) return "Low"
  if (density < 80) return "Medium"
  return "High"
}

export const getSensorData = () => {
  return {
    motionDetected: Math.random() > 0.3,
    temperature: 25 + Math.random() * 10,
    humidity: 40 + Math.random() * 30,
    soundLevel: Math.floor(Math.random() * 100),
    lastUpdated: new Date().toISOString(),
  }
}
