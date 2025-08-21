import { z } from "zod"
import { 
  SUPPORTED_IMAGE_TYPES, 
  SUPPORTED_VIDEO_TYPES, 
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  type FilterState,
  type GalleryItem 
} from "@/types"

// File validation schemas
export const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
  type: z.string().refine(
    (type) => [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES].includes(type as any),
    "Unsupported file type"
  ),
})

export const fileListSchema = z
  .array(fileSchema)
  .max(MAX_FILES_PER_UPLOAD, `Maximum ${MAX_FILES_PER_UPLOAD} files allowed`)

// API request schemas
export const uploadRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  tags: z.array(z.string().trim().min(1)).max(20, "Too many tags"),
  file: fileSchema,
})

export const updateFileRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  tags: z.array(z.string().trim().min(1)).max(20, "Too many tags").optional(),
})

export const tagGenerationRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  imageUrl: z.string().url("Valid image URL required"),
})

// Gallery item schemas
export const galleryItemSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
  url: z.string().url("Invalid URL"),
  title: z.string().min(1, "Title is required"),
  tags: z.array(z.string()),
  type: z.enum(["image", "video"]),
  dateAdded: z.date(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
})

export const filterStateSchema = z.object({
  fileTypes: z.array(z.enum(["image", "video"])),
  selectedTags: z.array(z.string()),
  sortBy: z.enum(["title", "date", "tags", "size"]),
  sortOrder: z.enum(["asc", "desc"]),
})

// Search and query schemas
export const searchQuerySchema = z.object({
  query: z.string().max(100, "Search query too long").optional(),
  filters: filterStateSchema.optional(),
  page: z.number().min(1).max(1000).optional(),
  limit: z.number().min(1).max(100).optional(),
})

// Validation functions
export function validateFile(file: File): { isValid: boolean; errors: string[] } {
  const result = fileSchema.safeParse(file)
  
  if (result.success) {
    return { isValid: true, errors: [] }
  }

  return {
    isValid: false,
    errors: result.error.errors.map(e => e.message)
  }
}

export function validateFileList(files: File[]): { isValid: boolean; errors: string[] } {
  const result = fileListSchema.safeParse(files)
  
  if (result.success) {
    return { isValid: true, errors: [] }
  }

  return {
    isValid: false,
    errors: result.error.errors.map(e => e.message)
  }
}

export function validateGalleryItem(item: unknown): item is GalleryItem {
  const result = galleryItemSchema.safeParse(item)
  return result.success
}

export function validateFilterState(filters: unknown): filters is FilterState {
  const result = filterStateSchema.safeParse(filters)
  return result.success
}

// Sanitization functions
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace invalid characters
    .replace(/_{2,}/g, "_") // Replace multiple underscores
    .substring(0, 100) // Limit length
}

export function sanitizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "") // Only allow alphanumeric and hyphens
    .substring(0, 30) // Limit length
}

export function sanitizeTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map(sanitizeTag).filter(tag => tag.length > 0)))
}

// Error formatting
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  errors.errors.forEach(error => {
    const path = error.path.join(".")
    formatted[path] = error.message
  })
  
  return formatted
}
