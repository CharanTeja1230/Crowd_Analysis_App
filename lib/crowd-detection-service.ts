/**
 * Enhanced Crowd Detection Service
 *
 * This service provides advanced crowd detection capabilities with improved accuracy
 * for counting individuals in various media formats.
 */

import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-backend-webgl"
import * as cocoSsd from "@tensorflow-models/coco-ssd"
import * as poseDetection from "@tensorflow-models/pose-detection"

// Types
export interface DetectionOptions {
  confidenceThreshold?: number
  enhanceLowLight?: boolean
  maxDetections?: number
  useMultipleModels?: boolean
  minKeypoints?: number
}

export interface VideoDetectionOptions extends DetectionOptions {
  frameRate?: number
  maxDuration?: number
  sampleFrames?: number
}

export interface Person {
  id: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  keypoints?: any[] // For pose detection
  isFullyVisible?: boolean // Whether the person is fully visible
  isOverlapping?: boolean // Whether this person overlaps with others
}

export interface CrowdAnalysisResult {
  crowdCount: number
  people: Person[]
  hotspots: Array<{ x: number; y: number; radius: number; intensity: number }>
  processingTime: number
  timestamp: string
}

// Model cache
let cocoModel: cocoSsd.ObjectDetection | null = null
let poseModel: poseDetection.PoseDetector | null = null
let modelsLoading = false
let modelsLoaded = false

// Performance optimization: Cache detection results
const resultCache = new Map<string, CrowdAnalysisResult>()

/**
 * Preload detection models to improve performance
 */
export async function preloadModels(): Promise<boolean> {
  if (modelsLoaded) return true
  if (modelsLoading) {
    // Wait for models to finish loading if already in progress
    while (modelsLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return modelsLoaded
  }

  modelsLoading = true

  try {
    console.log("Loading detection models...")

    // Initialize TensorFlow.js with WebGL backend for GPU acceleration
    await tf.setBackend("webgl")
    await tf.ready()

    // Load COCO-SSD model for object detection - using a more accurate model
    cocoModel = await cocoSsd.load({
      base: "mobilenet_v2",
    })

    // Load PoseNet model for pose estimation - helps with validation
    poseModel = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    })

    console.log("Detection models loaded successfully")
    modelsLoaded = true
    return true
  } catch (error) {
    console.error("Error loading detection models:", error)
    return false
  } finally {
    modelsLoading = false
  }
}

/**
 * Enhance image for better detection in challenging conditions
 */
function enhanceImage(imageData: ImageData): ImageData {
  const data = imageData.data
  const newData = new Uint8ClampedArray(data.length)

  // Apply adaptive brightness and contrast adjustment
  let min = 255
  let max = 0

  // Find min and max values for auto-levels
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (avg < min) min = avg
    if (avg > max) max = avg
  }

  // Skip adjustment if image already has good contrast
  if (max - min > 100) {
    return imageData
  }

  // Apply auto-levels and enhancement
  const range = max - min
  const factor = range > 0 ? 255 / range : 1

  for (let i = 0; i < data.length; i += 4) {
    // Enhance each channel
    for (let j = 0; j < 3; j++) {
      // Normalize to 0-255 range
      newData[i + j] = Math.min(255, Math.max(0, (data[i + j] - min) * factor))

      // Apply gamma correction for better visibility in dark areas
      newData[i + j] = Math.pow(newData[i + j] / 255, 0.8) * 255
    }
    newData[i + 3] = data[i + 3] // Copy alpha channel
  }

  return new ImageData(newData, imageData.width, imageData.height)
}

/**
 * Detect people in an image with improved accuracy
 */
export async function detectPeopleInImage(
  image: HTMLImageElement | HTMLVideoElement,
  options: DetectionOptions = {},
): Promise<CrowdAnalysisResult> {
  const startTime = performance.now()

  // Ensure models are loaded
  if (!modelsLoaded) {
    const loaded = await preloadModels()
    if (!loaded) {
      throw new Error("Failed to load detection models")
    }
  }

  // Set default options with balanced thresholds for accuracy
  const {
    confidenceThreshold = 0.35, // Lower threshold to catch more potential people
    enhanceLowLight = true,
    maxDetections = 200,
    useMultipleModels = true, // Use multiple detection approaches for validation
    minKeypoints = 3, // Minimum keypoints required for pose validation
  } = options

  // Create a canvas to process the image
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to create canvas context")
  }

  // Set canvas dimensions to match image
  canvas.width = image instanceof HTMLVideoElement ? image.videoWidth : image.naturalWidth || image.width
  canvas.height = image instanceof HTMLVideoElement ? image.videoHeight : image.naturalHeight || image.height

  // Draw image on canvas
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  // Get image data
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Enhance image if needed or enabled
  if (enhanceLowLight) {
    imageData = enhanceImage(imageData)
    ctx.putImageData(imageData, 0, 0)
  }

  // Detect objects using COCO-SSD
  const predictions = await cocoModel!.detect(canvas, maxDetections)

  // Filter for people with confidence above threshold
  const peopleDetections = predictions.filter(
    (pred) => pred.class === "person" && pred.score >= confidenceThreshold * 0.8, // Lower initial threshold to catch more candidates
  )

  // Convert COCO-SSD detections to our Person format
  let detectedPeople: Person[] = peopleDetections.map((detection, index) => {
    const [x, y, width, height] = detection.bbox

    return {
      id: `coco-person-${Date.now()}-${index}`,
      boundingBox: {
        x: x / canvas.width,
        y: y / canvas.height,
        width: width / canvas.width,
        height: height / canvas.height,
      },
      confidence: detection.score,
      isFullyVisible: isPersonFullyVisible({
        x: x / canvas.width,
        y: y / canvas.height,
        width: width / canvas.width,
        height: height / canvas.height,
      }),
    }
  })

  // Use pose detection for validation and to find additional people
  if (useMultipleModels) {
    try {
      // Detect poses
      const poses = await poseModel!.estimatePoses(canvas, {
        maxPoses: maxDetections,
        flipHorizontal: false,
      })

      // Validate COCO-SSD detections with pose detection
      detectedPeople = await validateWithPoseDetection(detectedPeople, poses, canvas.width, canvas.height, minKeypoints)

      // Add any people detected by pose model but missed by COCO-SSD
      const posePeople = convertPosesToPeople(poses, canvas.width, canvas.height, confidenceThreshold, minKeypoints)

      // Combine both detection methods
      detectedPeople = [...detectedPeople, ...posePeople]
    } catch (error) {
      console.warn("Pose detection validation failed, continuing with COCO-SSD results only", error)
    }
  }

  // Identify overlapping people
  detectedPeople = identifyOverlappingPeople(detectedPeople)

  // Remove duplicates with improved algorithm
  detectedPeople = removeDuplicatePeople(detectedPeople)

  // Final confidence filtering - be more lenient with overlapping people
  detectedPeople = detectedPeople.filter((person) => {
    if (person.isOverlapping) {
      // More lenient with overlapping people
      return person.confidence >= confidenceThreshold * 0.9
    }
    return person.confidence >= confidenceThreshold
  })

  // Generate hotspots for visualization
  const hotspots = generateHotspotsFromPeople(detectedPeople)

  const endTime = performance.now()
  const processingTime = (endTime - startTime) / 1000 // Convert to seconds

  const result: CrowdAnalysisResult = {
    crowdCount: detectedPeople.length,
    people: detectedPeople,
    hotspots,
    processingTime,
    timestamp: new Date().toISOString(),
  }

  return result
}

/**
 * Detect people in a video with improved accuracy
 */
export async function detectPeopleInVideo(
  video: HTMLVideoElement,
  options: VideoDetectionOptions = {},
): Promise<CrowdAnalysisResult> {
  const startTime = performance.now()

  // Ensure models are loaded
  if (!modelsLoaded) {
    const loaded = await preloadModels()
    if (!loaded) {
      throw new Error("Failed to load detection models")
    }
  }

  // Set default options
  const {
    confidenceThreshold = 0.35,
    enhanceLowLight = true,
    maxDetections = 200,
    frameRate = 1,
    maxDuration = 30,
    sampleFrames = 10,
    minKeypoints = 3,
  } = options

  // Create a canvas to process video frames
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to create canvas context")
  }

  // Ensure video is ready
  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      const loadHandler = () => {
        resolve()
        video.removeEventListener("loadeddata", loadHandler)
      }
      video.addEventListener("loadeddata", loadHandler)
    })
  }

  // Set canvas dimensions to match video
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // Calculate number of frames to analyze
  const videoDuration = Math.min(video.duration || 30, maxDuration)
  const framesToAnalyze =
    sampleFrames || Math.min(Math.ceil(frameRate * videoDuration), Math.ceil(frameRate * (video.duration || 30)))

  // Sample frames evenly throughout the video
  const frameInterval = videoDuration / framesToAnalyze
  const allFramePeople: Person[][] = []

  console.log(`Analyzing video: ${framesToAnalyze} frames over ${videoDuration.toFixed(1)}s`)

  // Process frames sequentially for more reliable results
  for (let i = 0; i < framesToAnalyze; i++) {
    const frameTime = i * frameInterval
    const framePeople = await processVideoFrame(video, canvas, ctx, frameTime, {
      confidenceThreshold,
      enhanceLowLight,
      maxDetections,
      useMultipleModels: true,
      minKeypoints,
    })

    allFramePeople.push(framePeople)
  }

  // Reset video position
  video.currentTime = 0

  // Find the frame with the most reliable people count
  // We'll use the frame with the highest average confidence and most people
  let bestFrameIndex = 0
  let bestFrameScore = 0

  allFramePeople.forEach((framePeople, index) => {
    if (framePeople.length === 0) return

    const avgConfidence = framePeople.reduce((sum, p) => sum + p.confidence, 0) / framePeople.length
    const score = avgConfidence * framePeople.length

    if (score > bestFrameScore) {
      bestFrameScore = score
      bestFrameIndex = index
    }
  })

  // Use the best frame for our result
  const bestFramePeople = allFramePeople[bestFrameIndex]

  // Generate hotspots for visualization
  const hotspots = generateHotspotsFromPeople(bestFramePeople)

  const endTime = performance.now()
  const processingTime = (endTime - startTime) / 1000

  const result: CrowdAnalysisResult = {
    crowdCount: bestFramePeople.length,
    people: bestFramePeople,
    hotspots,
    processingTime,
    timestamp: new Date().toISOString(),
  }

  return result
}

/**
 * Process a single video frame for people detection
 */
async function processVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  frameTime: number,
  options: DetectionOptions,
): Promise<Person[]> {
  // Set video to specific time
  video.currentTime = frameTime

  // Wait for video to seek to the specified time
  await new Promise<void>((resolve) => {
    const seekHandler = () => {
      resolve()
      video.removeEventListener("seeked", seekHandler)
    }
    video.addEventListener("seeked", seekHandler)
  })

  // Draw current frame on canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Get image data
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Enhance image if needed
  if (options.enhanceLowLight) {
    imageData = enhanceImage(imageData)
    ctx.putImageData(imageData, 0, 0)
  }

  // Detect objects in this frame
  const predictions = await cocoModel!.detect(canvas, options.maxDetections)

  // Filter for people with confidence above threshold
  const peopleDetections = predictions.filter(
    (pred) => pred.class === "person" && pred.score >= (options.confidenceThreshold || 0.35) * 0.8,
  )

  // Convert to our Person format
  let detectedPeople = peopleDetections.map((detection, index) => {
    const [x, y, width, height] = detection.bbox

    return {
      id: `video-person-${Date.now()}-${frameTime.toFixed(1)}-${index}`,
      boundingBox: {
        x: x / canvas.width,
        y: y / canvas.height,
        width: width / canvas.width,
        height: height / canvas.height,
      },
      confidence: detection.score,
      isFullyVisible: isPersonFullyVisible({
        x: x / canvas.width,
        y: y / canvas.height,
        width: width / canvas.width,
        height: height / canvas.height,
      }),
    }
  })

  // Use pose detection for validation if enabled
  if (options.useMultipleModels) {
    try {
      // Detect poses
      const poses = await poseModel!.estimatePoses(canvas, {
        maxPoses: options.maxDetections,
        flipHorizontal: false,
      })

      // Validate COCO-SSD detections with pose detection
      detectedPeople = await validateWithPoseDetection(
        detectedPeople,
        poses,
        canvas.width,
        canvas.height,
        options.minKeypoints || 3,
      )

      // Add any people detected by pose model but missed by COCO-SSD
      const posePeople = convertPosesToPeople(
        poses,
        canvas.width,
        canvas.height,
        options.confidenceThreshold || 0.35,
        options.minKeypoints || 3,
      )

      // Combine both detection methods
      detectedPeople = [...detectedPeople, ...posePeople]
    } catch (error) {
      console.warn("Pose detection validation failed for frame", error)
    }
  }

  // Identify overlapping people
  detectedPeople = identifyOverlappingPeople(detectedPeople)

  // Remove duplicates
  detectedPeople = removeDuplicatePeople(detectedPeople)

  // Final confidence filtering - be more lenient with overlapping people
  detectedPeople = detectedPeople.filter((person) => {
    if (person.isOverlapping) {
      // More lenient with overlapping people
      return person.confidence >= (options.confidenceThreshold || 0.35) * 0.9
    }
    return person.confidence >= (options.confidenceThreshold || 0.35)
  })

  return detectedPeople
}

/**
 * Check if a person is fully visible in the frame
 */
function isPersonFullyVisible(boundingBox: { x: number; y: number; width: number; height: number }): boolean {
  const { x, y, width, height } = boundingBox
  const margin = 0.02 // 2% margin from edges

  // Check if the bounding box is completely within the frame with margin
  return x > margin && y > margin && x + width < 1 - margin && y + height < 1 - margin
}

/**
 * Identify overlapping people in the detection results
 */
function identifyOverlappingPeople(people: Person[]): Person[] {
  if (people.length <= 1) return people

  // Create a copy to avoid modifying the original array while iterating
  const result = [...people]

  // Check each person against all others
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length; j++) {
      if (i !== j) {
        const iou = calculateIoU(result[i].boundingBox, result[j].boundingBox)

        // If there's significant overlap but not enough to be considered a duplicate
        if (iou > 0.1 && iou < 0.5) {
          result[i].isOverlapping = true
          result[j].isOverlapping = true
        }
      }
    }
  }

  return result
}

/**
 * Validate COCO-SSD detections with pose detection
 */
async function validateWithPoseDetection(
  people: Person[],
  poses: any[],
  canvasWidth: number,
  canvasHeight: number,
  minKeypoints: number,
): Promise<Person[]> {
  // If no poses detected, return original people
  if (!poses || poses.length === 0) return people

  return people.map((person) => {
    // Find poses that overlap with this person
    const matchingPoses = poses.filter((pose) => {
      if (!pose.keypoints || pose.keypoints.length === 0) return false

      // Calculate pose bounding box
      const keypoints = pose.keypoints.filter((kp: any) => kp.score && kp.score > 0.3)
      if (keypoints.length < minKeypoints) return false

      const xValues = keypoints.map((kp: any) => kp.x)
      const yValues = keypoints.map((kp: any) => kp.y)

      const minX = Math.min(...xValues) / canvasWidth
      const maxX = Math.max(...xValues) / canvasWidth
      const minY = Math.min(...yValues) / canvasHeight
      const maxY = Math.max(...yValues) / canvasHeight

      // Check if pose overlaps with person
      const poseBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }

      const iou = calculateIoU(person.boundingBox, poseBox)
      return iou > 0.2 // Lower threshold for matching
    })

    // If we found matching poses, increase confidence
    if (matchingPoses.length > 0) {
      // Average the pose scores with the person confidence
      const avgPoseScore = matchingPoses.reduce((sum, pose) => sum + (pose.score || 0.5), 0) / matchingPoses.length
      const validatedConfidence = (person.confidence + avgPoseScore) / 2

      // Add keypoints from the best matching pose
      const bestPose = matchingPoses.reduce(
        (best, pose) => ((pose.score || 0) > (best.score || 0) ? pose : best),
        matchingPoses[0],
      )

      return {
        ...person,
        confidence: validatedConfidence,
        keypoints: bestPose.keypoints,
      }
    }

    // No matching poses, slightly reduce confidence
    return {
      ...person,
      confidence: person.confidence * 0.95, // Less penalty
    }
  })
}

/**
 * Convert pose detection results to Person objects
 */
function convertPosesToPeople(
  poses: any[],
  canvasWidth: number,
  canvasHeight: number,
  confidenceThreshold: number,
  minKeypoints: number,
): Person[] {
  if (!poses || poses.length === 0) return []

  return poses
    .filter((pose) => pose.score && pose.score >= confidenceThreshold * 0.8) // Lower threshold to catch more candidates
    .map((pose, index) => {
      // Calculate bounding box from keypoints
      const keypoints = pose.keypoints.filter((kp: any) => kp.score && kp.score > 0.3)

      if (keypoints.length < minKeypoints) return null // Require minimum keypoints

      const xValues = keypoints.map((kp: any) => kp.x)
      const yValues = keypoints.map((kp: any) => kp.y)

      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const minY = Math.min(...yValues)
      const maxY = Math.max(...yValues)

      const width = maxX - minX
      const height = maxY - minY

      // Expand bounding box slightly to cover full body
      const expandedMinX = Math.max(0, minX - width * 0.1)
      const expandedMinY = Math.max(0, minY - height * 0.1)
      const expandedWidth = width * 1.2
      const expandedHeight = height * 1.2

      // Check if this is a valid person (has key body parts)
      const hasHead = keypoints.some((kp: any) => kp.name === "nose" && kp.score > 0.5)
      const hasTorso = keypoints.some(
        (kp: any) => (kp.name === "left_shoulder" || kp.name === "right_shoulder") && kp.score > 0.3,
      )

      // Require either head or torso for a valid person
      if (!hasHead && !hasTorso) return null

      // Calculate confidence based on keypoint scores and coverage
      const keypointScoreAvg = keypoints.reduce((sum, kp: any) => sum + kp.score, 0) / keypoints.length
      const coverage = keypoints.length / pose.keypoints.length
      const adjustedConfidence = pose.score ? (pose.score + keypointScoreAvg + coverage) / 3 : keypointScoreAvg

      return {
        id: `pose-person-${Date.now()}-${index}`,
        boundingBox: {
          x: expandedMinX / canvasWidth,
          y: expandedMinY / canvasHeight,
          width: expandedWidth / canvasWidth,
          height: expandedHeight / canvasHeight,
        },
        confidence: adjustedConfidence,
        keypoints: pose.keypoints,
        isFullyVisible:
          expandedMinX > 0 &&
          expandedMinY > 0 &&
          expandedMinX + expandedWidth < canvasWidth &&
          expandedMinY + expandedHeight < canvasHeight,
      }
    })
    .filter(Boolean) as Person[]
}

/**
 * Remove duplicate people detections with improved algorithm
 */
function removeDuplicatePeople(people: Person[]): Person[] {
  if (people.length <= 1) return people

  const uniquePeople: Person[] = []
  const iouThreshold = 0.4 // Balanced threshold

  // Sort by confidence (highest first)
  const sortedPeople = [...people].sort((a, b) => b.confidence - a.confidence)

  for (const person of sortedPeople) {
    let isDuplicate = false
    let duplicateIndex = -1

    // Check against existing unique people
    for (let i = 0; i < uniquePeople.length; i++) {
      const uniquePerson = uniquePeople[i]
      const iou = calculateIoU(person.boundingBox, uniquePerson.boundingBox)

      if (iou > iouThreshold) {
        isDuplicate = true
        duplicateIndex = i
        break
      }
    }

    if (isDuplicate && duplicateIndex >= 0) {
      // If this detection has higher confidence, replace the existing one
      if (person.confidence > uniquePeople[duplicateIndex].confidence + 0.1) {
        uniquePeople[duplicateIndex] = { ...person }
      }
      // If they have similar confidence but this one has keypoints and the other doesn't
      else if (
        Math.abs(person.confidence - uniquePeople[duplicateIndex].confidence) < 0.1 &&
        person.keypoints &&
        (!uniquePeople[duplicateIndex].keypoints ||
          person.keypoints.length > uniquePeople[duplicateIndex].keypoints.length)
      ) {
        uniquePeople[duplicateIndex] = { ...person }
      }
      // Otherwise, merge some properties
      else {
        // Keep the higher confidence one but merge keypoints if available
        if (person.keypoints && !uniquePeople[duplicateIndex].keypoints) {
          uniquePeople[duplicateIndex].keypoints = person.keypoints
        }

        // Mark as overlapping if either was overlapping
        if (person.isOverlapping) {
          uniquePeople[duplicateIndex].isOverlapping = true
        }
      }
    } else if (!isDuplicate) {
      uniquePeople.push({ ...person })
    }
  }

  return uniquePeople
}

/**
 * Calculate Intersection over Union for two bounding boxes
 */
function calculateIoU(box1: any, box2: any): number {
  // Calculate coordinates of intersection
  const xMin = Math.max(box1.x, box2.x)
  const yMin = Math.max(box1.y, box2.y)
  const xMax = Math.min(box1.x + box1.width, box2.x + box2.width)
  const yMax = Math.min(box1.y + box1.height, box2.y + box2.height)

  // Check if there is an intersection
  if (xMax < xMin || yMax < yMin) {
    return 0
  }

  // Calculate area of intersection
  const intersectionArea = (xMax - xMin) * (yMax - yMin)

  // Calculate areas of both boxes
  const box1Area = box1.width * box1.height
  const box2Area = box2.width * box2.height

  // Calculate IoU
  return intersectionArea / (box1Area + box2Area - intersectionArea)
}

/**
 * Generate hotspots from people for visualization purposes
 */
function generateHotspotsFromPeople(
  people: Person[],
): Array<{ x: number; y: number; radius: number; intensity: number }> {
  if (people.length === 0) {
    return []
  }

  return people.map((person) => {
    const { x, y, width, height } = person.boundingBox
    const centerX = x + width / 2
    const centerY = y + height / 2

    // Size radius based on person size
    const radius = Math.max(width, height) * 0.7

    // Intensity based on confidence
    const intensity = person.confidence

    return {
      x: centerX,
      y: centerY,
      radius,
      intensity,
    }
  })
}

/**
 * Wrapper function for media detection that handles both images and videos
 * with improved demo content support
 */
export async function detectPeopleInMedia(
  mediaId: string,
  mediaType: "image" | "video" | "live",
  mediaSource: string,
): Promise<CrowdAnalysisResult> {
  // Check cache first for performance
  const cacheKey = `${mediaType}-${mediaId}`
  if (resultCache.has(cacheKey)) {
    return resultCache.get(cacheKey)!
  }

  // For demo purposes, generate synthetic data based on mediaId
  // In a real app, this would process actual media files

  // Use hash of mediaId to generate consistent results
  const hash = hashString(mediaId)

  // Generate crowd count based on hash and media type
  let baseCount

  // Different base counts for different media types to make demos more realistic
  if (mediaType === "image") {
    baseCount = 8 + (hash % 15) // 8-22 people for images
  } else if (mediaType === "video") {
    baseCount = 12 + (hash % 20) // 12-31 people for videos
  } else {
    // live
    baseCount = 15 + (hash % 25) // 15-39 people for live feeds
  }

  // Add some randomness but keep it consistent for the same mediaId
  const crowdCount = Math.max(1, Math.round(baseCount * (0.9 + (hash % 100) / 500)))

  // Generate synthetic people data
  const people: Person[] = []
  for (let i = 0; i < crowdCount; i++) {
    const personHash = hashString(`${mediaId}-person-  = []
  for (let i = 0; i < crowdCount; i++) {
    const personHash = hashString(\`${mediaId}-person-${i}`)

    // Generate position based on hash - create clusters for more realism
    let x, y
    if (i % 3 === 0) {
      // Create clusters of people
      const clusterX = (personHash % 60) / 100 + 0.2 // 0.2 to 0.8
      const clusterY = ((personHash >> 8) % 60) / 100 + 0.2 // 0.2 to 0.8
      x = clusterX + (((personHash >> 4) % 20) - 10) / 100 // +/- 0.1 from cluster center
      y = clusterY + (((personHash >> 12) % 20) - 10) / 100 // +/- 0.1 from cluster center
    } else {
      x = (personHash % 80) / 100 + 0.1 // 0.1 to 0.9
      y = ((personHash >> 8) % 80) / 100 + 0.1 // 0.1 to 0.9
    }

    // Generate size based on hash and position (perspective simulation)
    const perspectiveScale = 1 - y * 0.3 // People further away (higher y) are smaller
    const width = ((((personHash >> 16) % 8) + 5) / 100) * perspectiveScale // 0.05 to 0.13
    const height = ((((personHash >> 24) % 12) + 10) / 100) * perspectiveScale // 0.1 to 0.22

    // Generate confidence based on hash
    const confidence = 0.6 + ((personHash >> 4) % 40) / 100 // 0.6 to 1.0

    // Some people are overlapping
    const isOverlapping = i % 5 === 0

    // Some people are partially visible
    const isFullyVisible = i % 7 !== 0

    people.push({
      id: `synthetic-person-${mediaId}-${i}`,
      boundingBox: {
        x,
        y,
        width,
        height,
      },
      confidence,
      isOverlapping,
      isFullyVisible,
    })
  }

  // Generate hotspots from people
  const hotspots = generateHotspotsFromPeople(people)

  // Create result
  const result: CrowdAnalysisResult = {
    crowdCount,
    people,
    hotspots,
    processingTime: 0.5 + (hash % 20) / 10, // 0.5 to 2.5 seconds
    timestamp: new Date().toISOString(),
  }

  // Cache result for performance
  resultCache.set(cacheKey, result)

  return result
}

/**
 * Simple string hash function for generating consistent synthetic data
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
