export interface FilterState {
  fileTypes: string[]
  selectedTags: string[]
  sortBy: "title" | "date" | "tags"
  sortOrder: "asc" | "desc"
}
