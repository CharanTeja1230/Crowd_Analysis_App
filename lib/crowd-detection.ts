// This file contains the logic for detecting people in media (images, videos, live feed)
// and generating crowd analysis results

// Types for crowd detection and analysis
export interface Person {
  id: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  trackId?: string // For tracking across video frames
}

export interface Anomaly {
  type: string
  confidence: number
  location: string
  timestamp: string
}

export interface CrowdAnalysisResult {
  crowdCount: number
  density: number
  people: Person[]
  hotspots: Array<{
    x: number
    y: number
    radius: number
    intensity: number
  }>
  anomalies: Anomaly[]
  processingTime: number
  timestamp: string
}

// Function to detect people in media (image, video, live feed)
export async function detectPeopleInMedia(
  mediaId: string,
  mediaType: "image" | "video" | "live",
  seed: string,
): Promise<CrowdAnalysisResult> {
  // In a real application, this would call a machine learning model API
  // For demo purposes, we'll generate deterministic results based on the mediaId

  // Create a deterministic seed from the mediaId
  const seedValue = hashString(seed)
  const random = seededRandom(seedValue)

  // Determine if we should simulate a detection failure (reduced to 2%)
  const shouldSimulateFailure = random() < 0.02

  if (shouldSimulateFailure) {
    throw new Error("Detection failed. The application is unable to provide an accurate count of people.")
  }

  // Generate a consistent number of people based on the seed
  // More realistic crowd counts based on media type
  let peopleCount
  if (mediaType === "image") {
    peopleCount = Math.floor(random() * 100) + 10 // 10-110 people
  } else if (mediaType === "video") {
    peopleCount = Math.floor(random() * 150) + 20 // 20-170 people
  } else {
    // live
    peopleCount = Math.floor(random() * 200) + 30 // 30-230 people
  }

  // Generate people with bounding boxes
  const people: Person[] = []
  for (let i = 0; i < peopleCount; i++) {
    const id = `person-${i}-${seedValue}`

    // Create clusters of people for more realistic distribution
    // This creates hotspots where people gather
    let x, y
    if (i % 3 === 0) {
      // Create clusters
      const clusterX = random() * 0.7 + 0.15 // Cluster center X (avoid edges)
      const clusterY = random() * 0.7 + 0.15 // Cluster center Y (avoid edges)
      x = clusterX + (random() * 0.2 - 0.1) // Random offset from cluster center
      y = clusterY + (random() * 0.2 - 0.1) // Random offset from cluster center
    } else {
      x = random() // Normalized x position (0-1)
      y = random() // Normalized y position (0-1)
    }

    // Vary sizes based on position (perspective simulation)
    // People further away (higher y) are smaller
    const perspectiveScale = 1 - y * 0.5
    const width = (0.03 + random() * 0.04) * perspectiveScale // Random width with perspective
    const height = (0.08 + random() * 0.06) * perspectiveScale // Random height with perspective

    // Higher confidence for people in the center, lower at edges
    const distanceFromCenter = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2))
    const confidence = Math.max(0.7, 0.95 - distanceFromCenter)

    people.push({
      id,
      boundingBox: { x, y, width, height },
      confidence,
      trackId: mediaType === "video" || mediaType === "live" ? `track-${i}-${seedValue}` : undefined,
    })
  }

  // Calculate density based on people count and distribution
  // More accurate density calculation based on area coverage
  const totalArea = people.reduce((sum, person) => {
    return sum + person.boundingBox.width * person.boundingBox.height
  }, 0)

  // Density as percentage of covered area with some randomness
  const density = Math.min(Math.floor(totalArea * 100 * 5) + Math.floor(random() * 10), 100)

  // Generate hotspots based on people clusters
  const hotspots = generateHotspotsFromPeople(people, random)

  // Generate anomalies (if any)
  const anomalies: Anomaly[] = []
  if (density > 75 || random() > 0.8) {
    anomalies.push({
      type: "crowd_surge",
      confidence: 0.7 + random() * 0.3,
      location: random() > 0.5 ? "center" : "northeast",
      timestamp: new Date().toISOString(),
    })
  }

  // Simulate processing time (faster for images, slower for video/live)
  const processingTime = mediaType === "image" ? 0.2 + random() * 0.8 : 0.5 + random() * 1.5

  return {
    crowdCount: peopleCount,
    density,
    people,
    hotspots,
    anomalies,
    processingTime,
    timestamp: new Date().toISOString(),
  }
}

// Function to generate hotspots from detected people
function generateHotspotsFromPeople(
  people: Person[],
  random: () => number,
): Array<{ x: number; y: number; radius: number; intensity: number }> {
  // If no people, return empty hotspots
  if (people.length === 0) {
    return []
  }

  // Create clusters of people
  const clusters: { x: number; y: number; count: number }[] = []
  const clusterRadius = 0.15 // Cluster radius (normalized)

  // Assign each person to a cluster or create a new one
  people.forEach((person) => {
    const personX = person.boundingBox.x + person.boundingBox.width / 2
    const personY = person.boundingBox.y + person.boundingBox.height / 2

    // Check if person is in an existing cluster
    let foundCluster = false
    for (const cluster of clusters) {
      const distance = Math.sqrt(Math.pow(cluster.x - personX, 2) + Math.pow(cluster.y - personY, 2))

      if (distance < clusterRadius) {
        // Update cluster center (weighted average)
        cluster.x = (cluster.x * cluster.count + personX) / (cluster.count + 1)
        cluster.y = (cluster.y * cluster.count + personY) / (cluster.count + 1)
        cluster.count++
        foundCluster = true
        break
      }
    }

    // If not in any cluster, create a new one
    if (!foundCluster) {
      clusters.push({ x: personX, y: personY, count: 1 })
    }
  })

  // Merge nearby clusters
  const mergedClusters: typeof clusters = []
  clusters.forEach((cluster) => {
    let merged = false
    for (const existingCluster of mergedClusters) {
      const distance = Math.sqrt(
        Math.pow(existingCluster.x - cluster.x, 2) + Math.pow(existingCluster.y - cluster.y, 2),
      )

      if (distance < clusterRadius * 1.5) {
        // Merge clusters
        const totalCount = existingCluster.count + cluster.count
        existingCluster.x = (existingCluster.x * existingCluster.count + cluster.x * cluster.count) / totalCount
        existingCluster.y = (existingCluster.y * existingCluster.count + cluster.y * cluster.count) / totalCount
        existingCluster.count += cluster.count
        merged = true
        break
      }
    }

    if (!merged) {
      mergedClusters.push({ ...cluster })
    }
  })

  // Convert clusters to hotspots
  return mergedClusters.map((cluster) => {
    // Radius and intensity based on cluster size
    const normalizedCount = Math.min(cluster.count / (people.length * 0.3), 1)
    const radius = 0.08 + normalizedCount * 0.15
    const intensity = 0.4 + normalizedCount * 0.6

    return {
      x: cluster.x,
      y: cluster.y,
      radius,
      intensity,
    }
  })
}

// Function to predict future crowd density based on historical data
export function predictFutureDensity(historicalData: any[]): any[] {
  // In a real application, this would use a time series prediction model
  // For demo purposes, we'll generate predictions based on time patterns

  const predictions = []
  const now = new Date()

  // Generate predictions for the next 12 hours
  for (let i = 0; i < 12; i++) {
    const hour = (now.getHours() + i) % 24
    const hourLabel = `${hour}:00`

    // Create realistic density patterns based on time of day
    let density
    if (hour >= 17 && hour <= 19) {
      // Evening rush hour
      density = 70 + Math.floor(Math.random() * 25)
    } else if (hour >= 7 && hour <= 9) {
      // Morning rush hour
      density = 60 + Math.floor(Math.random() * 20)
    } else if (hour >= 12 && hour <= 14) {
      // Lunch hour
      density = 50 + Math.floor(Math.random() * 15)
    } else if (hour >= 22 || hour <= 5) {
      // Night time
      density = 5 + Math.floor(Math.random() * 15)
    } else {
      // Regular hours
      density = 20 + Math.floor(Math.random() * 30)
    }

    predictions.push({
      hour: hourLabel,
      density,
      predicted: true,
    })
  }

  return predictions
}

// Helper function to generate a hash from a string
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Seeded random number generator for consistent results
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}
