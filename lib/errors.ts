import type { AppError, ValidationError } from "@/types"

// Error codes
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  TOO_MANY_FILES: "TOO_MANY_FILES",
  
  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  
  // Storage errors
  STORAGE_ERROR: "STORAGE_ERROR",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  DELETE_FAILED: "DELETE_FAILED",
  
  // API errors
  API_ERROR: "API_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  RATE_LIMITED: "RATE_LIMITED",
  
  // AI/Tag generation errors
  TAG_GENERATION_ERROR: "TAG_GENERATION_ERROR",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  
  // Generic errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Error classes
export class AppErrorClass extends Error implements AppError {
  public readonly code: ErrorCode
  public readonly details?: unknown
  public readonly timestamp: Date

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.details = details
    this.timestamp = new Date()
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    }
  }
}

export class ValidationErrorClass extends AppErrorClass implements ValidationError {
  public readonly field?: string
  public readonly expectedType?: string

  constructor(message: string, field?: string, expectedType?: string, details?: unknown) {
    super(ERROR_CODES.VALIDATION_ERROR, message, details)
    this.name = "ValidationError"
    this.field = field
    this.expectedType = expectedType
  }
}

// Error factory functions
export function createAppError(code: ErrorCode, message: string, details?: unknown): AppErrorClass {
  return new AppErrorClass(code, message, details)
}

export function createValidationError(message: string, field?: string, expectedType?: string, details?: unknown): ValidationErrorClass {
  return new ValidationErrorClass(message, field, expectedType, details)
}

// Error handling utilities
export function isAppError(error: unknown): error is AppErrorClass {
  return error instanceof AppErrorClass
}

export function isValidationError(error: unknown): error is ValidationErrorClass {
  return error instanceof ValidationErrorClass
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === "string") {
    return error
  }
  
  return "An unexpected error occurred"
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isAppError(error)) {
    return error.code
  }
  
  return ERROR_CODES.UNKNOWN_ERROR
}

// Error logging
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString()
  const errorMessage = getErrorMessage(error)
  const errorCode = getErrorCode(error)
  
  console.error(`[${timestamp}] ${context ? `[${context}] ` : ""}${errorCode}: ${errorMessage}`)
  
  if (isAppError(error) && error.details) {
    console.error("Error details:", error.details)
  }
  
  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack)
  }
}

// Error response helpers for API routes
export function createErrorResponse(error: unknown, status: number = 500) {
  const errorMessage = getErrorMessage(error)
  const errorCode = getErrorCode(error)
  
  return {
    success: false,
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
  }
}

export function handleApiError(error: unknown, context?: string) {
  logError(error, context)
  
  if (isValidationError(error)) {
    return { response: createErrorResponse(error), status: 400 }
  }
  
  if (isAppError(error)) {
    switch (error.code) {
      case ERROR_CODES.FILE_NOT_FOUND:
        return { response: createErrorResponse(error), status: 404 }
      case ERROR_CODES.UNAUTHORIZED:
        return { response: createErrorResponse(error), status: 401 }
      case ERROR_CODES.RATE_LIMITED:
        return { response: createErrorResponse(error), status: 429 }
      default:
        return { response: createErrorResponse(error), status: 500 }
    }
  }
  
  return { 
    response: createErrorResponse(createAppError(ERROR_CODES.INTERNAL_ERROR, "Internal server error")), 
    status: 500 
  }
}

// Client-side error handling
export function createUserFriendlyMessage(error: unknown): string {
  const code = getErrorCode(error)
  
  switch (code) {
    case ERROR_CODES.INVALID_FILE_TYPE:
      return "Please select a supported file type (images or videos only)"
    case ERROR_CODES.FILE_TOO_LARGE:
      return "File is too large. Please select a file smaller than 50MB"
    case ERROR_CODES.TOO_MANY_FILES:
      return "Too many files selected. Please try uploading in smaller batches if you experience issues"
    case ERROR_CODES.NETWORK_ERROR:
      return "Network connection error. Please check your internet connection"
    case ERROR_CODES.UPLOAD_FAILED:
      return "Upload failed. Please try again"
    case ERROR_CODES.FILE_NOT_FOUND:
      return "File not found. It may have been deleted"
    case ERROR_CODES.TAG_GENERATION_ERROR:
      return "Could not generate tags automatically. You can add them manually"
    default:
      return "Something went wrong. Please try again"
  }
}
