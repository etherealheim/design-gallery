// Core domain types
export interface GalleryItem {
  id: string
  url: string
  title: string
  tags: string[]
  type: "image" | "video" | "gif"
  dateAdded: Date
  fileSize?: number
  mimeType?: string
}

export interface UploadedFile extends GalleryItem {
  file?: File // Optional for persisted files from database
}

export interface DatabaseFile {
  id: string
  title: string
  file_path: string
  file_type: string
  file_size: number
  tags: string[]
  created_at: string
  updated_at?: string
}

// Filter and UI state types
export interface FilterState {
  fileTypes: ("image" | "video" | "gif")[]
  selectedTags: string[]
  sortBy: "title" | "date" | "tags" | "size"
  sortOrder: "asc" | "desc"
}

export interface ViewState {
  mode: "grid" | "list"
  galleryMode: "recent" | "random" | "no-tag"
  isFilterOpen: boolean
  selectedFiles: Set<string>
}

// API types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export interface UploadResponse extends ApiResponse {
  data?: {
    file: DatabaseFile
  }
}

export interface TagGenerationResponse extends ApiResponse {
  data?: {
    tags: string[]
    confidence: number
  }
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: unknown
  timestamp: Date
}

export interface ValidationError extends AppError {
  field?: string
  expectedType?: string
}

// Upload types
export interface UploadProgress {
  fileName: string
  progress: number
  stage: "uploading" | "generating" | "complete" | "error"
  error?: string
}

export interface PendingTags {
  [fileId: string]: string[]
}

// Component prop types
export interface GalleryGridProps {
  items: GalleryItem[]
  viewMode: ViewState["mode"]
  onItemSelect: (item: GalleryItem) => void
  onItemEdit: (item: GalleryItem) => void
  onItemDelete: (itemId: string) => void
  isLoading?: boolean
}

export interface FilterSidebarProps {
  filters: FilterState
  availableTags: string[]
  onFiltersChange: (filters: FilterState) => void
  totalItems: number
  filteredItems: number
  isOpen: boolean
  onClose: () => void
}

// Utility types
export type SortableField = FilterState["sortBy"]
export type SortDirection = FilterState["sortOrder"]
export type FileType = GalleryItem["type"]
export type UploadStage = UploadProgress["stage"]

// Constants
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png", 
  "image/gif",
  "image/webp",
  "image/svg+xml"
] as const

export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/avi",
  "video/mov",
  "video/quicktime", // QuickTime H.264
  "video/x-msvideo", // Alternative AVI MIME type
  "video/3gpp", // Mobile 3GP format
  "video/3gpp2", // Mobile 3GP2 format
  "video/x-ms-wmv" // Windows Media Video
] as const

export const MAX_FILE_SIZE = 512 * 1024 * 1024 // 512MB to accommodate large iPhone videos
// No limit on files per upload

// Type guards
export function isGalleryItem(item: unknown): item is GalleryItem {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as GalleryItem).id === "string" &&
    typeof (item as GalleryItem).url === "string" &&
    typeof (item as GalleryItem).title === "string" &&
    Array.isArray((item as GalleryItem).tags) &&
    ["image", "video"].includes((item as GalleryItem).type) &&
    (item as GalleryItem).dateAdded instanceof Date
  )
}

export function isUploadedFile(item: unknown): item is UploadedFile {
  return isGalleryItem(item) && ((item as UploadedFile).file === undefined || (item as UploadedFile).file instanceof File)
}

export function isDatabaseFile(item: unknown): item is DatabaseFile {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as DatabaseFile).id === "string" &&
    typeof (item as DatabaseFile).file_path === "string" &&
    typeof (item as DatabaseFile).created_at === "string"
  )
}
