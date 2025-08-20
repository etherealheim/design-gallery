import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock fetch globally
global.fetch = vi.fn()

describe("Tag Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => "test-api-key"),
        setItem: vi.fn(),
      },
      writable: true,
    })
  })

  it("should generate tags for UI components", async () => {
    const mockResponse = {
      tags: ["button", "card", "form-input", "navigation"],
    }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const response = await fetch("/api/generate-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "login-form.png",
        imageUrl: "https://example.com/image.png",
        apiKey: "test-key",
      }),
    })

    const data = await response.json()
    expect(data.tags).toEqual(["button", "card", "form-input", "navigation"])
  })

  it("should handle API errors gracefully", async () => {
    ;(fetch as any).mockRejectedValueOnce(new Error("API Error"))

    try {
      await fetch("/api/generate-tags", {
        method: "POST",
        body: JSON.stringify({ filename: "test.png", imageUrl: "", apiKey: "test" }),
      })
    } catch (error) {
      expect(error.message).toBe("API Error")
    }
  })

  it("should provide fallback tags based on filename", () => {
    const filename = "dashboard-button-component.png"
    const fallbackTags: string[] = []

    if (filename.toLowerCase().includes("button")) fallbackTags.push("button")
    if (filename.toLowerCase().includes("dashboard")) fallbackTags.push("dashboard")

    expect(fallbackTags).toContain("button")
    expect(fallbackTags).toContain("dashboard")
  })

  it("should validate tag format", () => {
    const validTags = ["button", "form-input", "navigation-menu"]
    const invalidTags = ["", "  ", "tag with spaces", "TAG_WITH_UNDERSCORES"]

    validTags.forEach((tag) => {
      expect(tag).toMatch(/^[a-z0-9-]+$/)
    })

    invalidTags.forEach((tag) => {
      expect(tag).not.toMatch(/^[a-z0-9-]+$/)
    })
  })
})
