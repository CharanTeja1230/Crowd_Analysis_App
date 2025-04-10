export interface SensorData {
  id: string
  type: "motion" | "sound" | "temperature" | "humidity" | "air"
  value: number
  status: "online" | "offline" | "warning"
  timestamp: string
  location: string
  battery?: number
  threshold?: {
    min: number
    max: number
  }
}

export interface SensorStatus {
  motion: boolean
  sound: boolean
  temperature: boolean
  humidity: boolean
}

export interface SensorReadings {
  motion: {
    value: number
    detected: boolean
    timestamp: string
  }
  sound: {
    value: number
    threshold: number
    timestamp: string
  }
  temperature: {
    value: number
    unit: "C" | "F"
    timestamp: string
  }
  humidity: {
    value: number
    timestamp: string
  }
}

export interface ESP32Data {
  deviceId: string
  location: string
  timestamp: string
  sensors: SensorReadings
  battery: number
  status: "online" | "offline" | "warning"
}

// Mock sensor data generator
export function generateMockSensorData(location: string, isOnline = true): ESP32Data {
  const timestamp = new Date().toISOString()

  return {
    deviceId: `ESP32-${Math.floor(Math.random() * 1000)}`,
    location,
    timestamp,
    sensors: {
      motion: {
        value: isOnline ? (Math.random() > 0.3 ? 1 : 0) : 0,
        detected: isOnline ? Math.random() > 0.3 : false,
        timestamp,
      },
      sound: {
        value: isOnline ? Math.floor(Math.random() * 100) : 0,
        threshold: 70,
        timestamp,
      },
      temperature: {
        value: isOnline ? 22 + Math.random() * 10 : 0,
        unit: "C",
        timestamp,
      },
      humidity: {
        value: isOnline ? 40 + Math.random() * 40 : 0,
        timestamp,
      },
    },
    battery: 70 + Math.floor(Math.random() * 30),
    status: isOnline ? "online" : "offline",
  }
}

// Add this function to fetch real sensor data
export async function fetchRealSensorData(location: string): Promise<ESP32Data | null> {
  try {
    // In a real implementation, this would be an actual API call
    // const response = await fetch(`https://your-iot-api.com/sensors?location=${encodeURIComponent(location)}`);
    // if (!response.ok) throw new Error('Failed to fetch sensor data');
    // return await response.json();

    // For demo purposes, we'll simulate a real API call with a delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate data that simulates real sensor readings
    // In a real app, this would come from your actual sensors
    return {
      deviceId: `ESP32-${hashString(location)}`,
      location,
      timestamp: new Date().toISOString(),
      sensors: {
        motion: {
          value: Math.random() > 0.3 ? 1 : 0,
          detected: Math.random() > 0.3,
          timestamp: new Date().toISOString(),
        },
        sound: {
          value: Math.floor(Math.random() * 100),
          threshold: 70,
          timestamp: new Date().toISOString(),
        },
        temperature: {
          value: 22 + Math.random() * 10,
          unit: "C",
          timestamp: new Date().toISOString(),
        },
        humidity: {
          value: 40 + Math.random() * 40,
          timestamp: new Date().toISOString(),
        },
      },
      battery: 70 + Math.floor(Math.random() * 30),
      status: "online",
    }
  } catch (error) {
    console.error("Error fetching real sensor data:", error)
    return null
  }
}

// Helper function to generate a consistent hash from a string
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash % 1000)
}

// Function to check if sensors are online
export function getSensorStatus(data?: ESP32Data): SensorStatus {
  if (!data || data.status === "offline") {
    return {
      motion: false,
      sound: false,
      temperature: false,
      humidity: false,
    }
  }

  return {
    motion: true,
    sound: true,
    temperature: true,
    humidity: true,
  }
}

// Function to determine if a sensor reading is anomalous
export function isAnomalous(type: string, value: number): boolean {
  switch (type) {
    case "motion":
      return value > 0.8 // High motion detected
    case "sound":
      return value > 80 // Loud noise
    case "temperature":
      return value > 35 || value < 15 // Extreme temperatures
    case "humidity":
      return value > 80 || value < 20 // Extreme humidity
    default:
      return false
  }
}

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
