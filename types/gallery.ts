export interface GalleryItem {
  id: string
  url: string
  title: string
  tags: string[]
  type: "image" | "video"
  dateAdded: Date
}

export interface UploadedFile {
  id: string
  file: File
  url: string
  title: string
  tags: string[]
  type: "image" | "video"
  dateAdded: Date
}
