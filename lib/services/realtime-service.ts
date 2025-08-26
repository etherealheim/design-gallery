"use client"

import { supabase } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import type { GalleryItem, DatabaseFile } from "@/types"
import { transformDatabaseFileToGalleryItem } from "./file-service"
import { logError } from "@/lib/errors"

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE"

export interface RealtimeEvent {
  eventType: RealtimeEventType
  new?: GalleryItem
  old?: GalleryItem
  timestamp: number
}

export type RealtimeCallback = (event: RealtimeEvent) => void

export class RealtimeService {
  private static channel: RealtimeChannel | null = null
  private static callbacks: Set<RealtimeCallback> = new Set()
  private static isConnected = false

  /**
   * Subscribe to real-time changes in the uploaded_files table
   */
  static subscribe(callback: RealtimeCallback): () => void {
    this.callbacks.add(callback)

    // Initialize channel if this is the first subscription
    if (!this.channel && this.callbacks.size === 1) {
      this.initializeChannel()
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
      
      // Clean up channel if no more callbacks
      if (this.callbacks.size === 0) {
        this.cleanup()
      }
    }
  }

  /**
   * Initialize the real-time channel
   */
  private static initializeChannel() {
    try {
      this.channel = supabase
        .channel("uploaded_files_changes")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "uploaded_files",
          },
          (payload) => {
            console.log("Real-time event received:", payload)
            this.handleRealtimeEvent(payload)
          }
        )
        .subscribe((status) => {
          console.log("Real-time subscription status:", status)
          this.isConnected = status === "SUBSCRIBED"
          
          if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            console.warn("Real-time connection lost, attempting to reconnect...")
            this.reconnect()
          }
        })
    } catch (error) {
      logError(error, "RealtimeService.initializeChannel")
      console.error("Failed to initialize real-time channel:", error)
    }
  }

  /**
   * Handle incoming real-time events
   */
  private static handleRealtimeEvent(payload: any) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload

      const event: RealtimeEvent = {
        eventType: eventType as RealtimeEventType,
        timestamp: Date.now(),
      }

      // Transform database records to GalleryItems
      if (newRecord) {
        event.new = transformDatabaseFileToGalleryItem(newRecord as DatabaseFile)
      }
      
      if (oldRecord) {
        event.old = transformDatabaseFileToGalleryItem(oldRecord as DatabaseFile)
      }

      // Notify all subscribers
      this.callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          logError(error, "RealtimeService.handleRealtimeEvent.callback")
          console.error("Error in real-time callback:", error)
        }
      })
    } catch (error) {
      logError(error, "RealtimeService.handleRealtimeEvent")
      console.error("Error handling real-time event:", error)
    }
  }

  /**
   * Reconnect to real-time channel
   */
  private static async reconnect() {
    if (this.callbacks.size === 0) return

    console.log("Reconnecting real-time channel...")
    this.cleanup()
    
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (this.callbacks.size > 0) {
      this.initializeChannel()
    }
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get number of active subscribers
   */
  static getSubscriberCount(): number {
    return this.callbacks.size
  }

  /**
   * Manually trigger reconnection
   */
  static async forceReconnect(): Promise<void> {
    console.log("Force reconnecting real-time channel...")
    await this.reconnect()
  }

  /**
   * Clean up resources
   */
  private static cleanup() {
    if (this.channel) {
      console.log("Cleaning up real-time channel...")
      this.channel.unsubscribe()
      this.channel = null
    }
    this.isConnected = false
  }

  /**
   * Clean up all subscriptions (for component unmount)
   */
  static unsubscribeAll() {
    this.callbacks.clear()
    this.cleanup()
  }
}
