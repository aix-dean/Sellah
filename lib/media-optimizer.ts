/**
 * Media Optimizer Utility
 *
 * This utility provides functions to optimize images and videos before uploading
 * to Firebase Storage, reducing file sizes while maintaining acceptable quality.
 */

// Maximum dimensions for product images
const MAX_IMAGE_WIDTH = 1920
const MAX_IMAGE_HEIGHT = 1920

// Quality settings (0-1 where 1 is highest quality)
const IMAGE_QUALITY = 0.85
const THUMBNAIL_QUALITY = 0.7

// Size thresholds for optimization (in bytes)
const IMAGE_SIZE_THRESHOLD = 1024 * 1024 // 1MB
const VIDEO_SIZE_THRESHOLD = 10 * 1024 * 1024 // 10MB

/**
 * Optimizes an image by resizing and compressing it
 * @param file Original image file
 * @param options Optimization options
 * @returns Promise with the optimized file and metadata
 */
export async function optimizeImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    generateThumbnail?: boolean
  } = {},
): Promise<{
  optimizedFile: File
  originalSize: number
  optimizedSize: number
  width: number
  height: number
  compressionRatio: number
  thumbnail?: string
}> {
  // Use provided options or defaults
  const maxWidth = options.maxWidth || MAX_IMAGE_WIDTH
  const maxHeight = options.maxHeight || MAX_IMAGE_HEIGHT
  const quality = options.quality || IMAGE_QUALITY
  const generateThumbnail = options.generateThumbnail || false

  // Skip optimization for small files unless thumbnail is requested
  if (file.size < IMAGE_SIZE_THRESHOLD && !generateThumbnail) {
    return {
      optimizedFile: file,
      originalSize: file.size,
      optimizedSize: file.size,
      width: 0, // We don't know the dimensions without processing
      height: 0,
      compressionRatio: 1,
    }
  }

  // Create an image object to load the file
  const img = new Image()
  const objectUrl = URL.createObjectURL(file)

  try {
    // Load the image and wait for it to be ready
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = objectUrl
    })

    // Calculate new dimensions while maintaining aspect ratio
    let width = img.width
    let height = img.height

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.floor(width * ratio)
      height = Math.floor(height * ratio)
    }

    // Create canvas for the full-size image
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Draw image to canvas with smoothing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, 0, 0, width, height)

    // Generate thumbnail if requested
    let thumbnail: string | undefined
    if (generateThumbnail) {
      const thumbCanvas = document.createElement("canvas")
      const thumbSize = 200 // Fixed thumbnail size
      thumbCanvas.width = thumbSize
      thumbCanvas.height = thumbSize

      const thumbCtx = thumbCanvas.getContext("2d")
      if (thumbCtx) {
        // Calculate thumbnail dimensions (centered square crop)
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2

        thumbCtx.imageSmoothingEnabled = true
        thumbCtx.imageSmoothingQuality = "medium"
        thumbCtx.drawImage(img, sx, sy, size, size, 0, 0, thumbSize, thumbSize)

        // Get thumbnail as data URL
        thumbnail = thumbCanvas.toDataURL("image/jpeg", THUMBNAIL_QUALITY)
      }
    }

    // Convert canvas to blob with specified quality
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob || new Blob()), file.type, quality)
    })

    // Create new file from blob
    const optimizedFile = new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    })

    return {
      optimizedFile,
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
      width,
      height,
      compressionRatio: file.size / optimizedFile.size,
      thumbnail,
    }
  } finally {
    // Clean up object URL
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
}

/**
 * Checks if a file should be optimized based on type and size
 */
export function shouldOptimizeFile(file: File): boolean {
  // Check if it's an image
  if (file.type.startsWith("image/")) {
    return file.size > IMAGE_SIZE_THRESHOLD
  }

  // Check if it's a video
  if (file.type.startsWith("video/")) {
    return file.size > VIDEO_SIZE_THRESHOLD
  }

  // Don't optimize other file types
  return false
}

/**
 * Estimates the optimization level based on the compression ratio
 */
export function getOptimizationLevel(compressionRatio: number): "low" | "medium" | "high" {
  if (compressionRatio < 1.5) return "low"
  if (compressionRatio < 3) return "medium"
  return "high"
}
