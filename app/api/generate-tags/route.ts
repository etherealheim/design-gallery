import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

function generateFallbackTags(filename: string): string[] {
  const name = filename.toLowerCase()
  const tags: string[] = []

  // UI component patterns
  if (name.includes("button")) tags.push("button", "interactive")
  if (name.includes("form")) tags.push("form", "input")
  if (name.includes("card")) tags.push("card", "container")
  if (name.includes("nav")) tags.push("navigation", "menu")
  if (name.includes("chart") || name.includes("graph")) tags.push("chart", "data-viz")
  if (name.includes("table")) tags.push("table", "data-display")
  if (name.includes("modal") || name.includes("dialog")) tags.push("modal", "overlay")
  if (name.includes("dashboard")) tags.push("dashboard", "layout")
  if (name.includes("login") || name.includes("auth")) tags.push("authentication", "form")
  if (name.includes("profile")) tags.push("profile", "user")
  if (name.includes("settings")) tags.push("settings", "configuration")
  if (name.includes("dark")) tags.push("dark-mode")
  if (name.includes("light")) tags.push("light-mode")

  // Default fallback
  if (tags.length === 0) {
    tags.push("ui-component", "design")
  }

  return tags.slice(0, 4)
}

export async function POST(request: NextRequest) {
  try {
    const { filename, imageUrl } = await request.json()

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error("OpenAI API key is missing. Please add OPENAI_API_KEY to your Vercel environment variables.")
    }

    const openaiProvider = createOpenAI({
      apiKey: apiKey,
    })

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[v0] Tag generation attempt ${attempt}/${maxRetries} for: ${filename}`)

        const { text } = await Promise.race([
          generateText({
            model: openaiProvider("gpt-4o"),
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this UI design image and identify SPECIFIC design system components and UI patterns you can see.

FOCUS ON DESIGN SYSTEM COMPONENTS:
**Interactive Elements:**
- Buttons: (primary-button, secondary-button, ghost-button, icon-button, fab-button, split-button)
- Form Controls: (text-input, select-dropdown, checkbox, radio-button, toggle-switch, slider, date-picker)
- Navigation: (breadcrumb, pagination, tabs, stepper, sidebar-nav, top-nav, bottom-nav)

**Data Display:**
- Charts: (line-chart, bar-chart, pie-chart, donut-chart, area-chart, scatter-plot, heatmap, gauge)
- Tables: (data-table, sortable-table, expandable-rows, pagination-table)
- Lists: (avatar-list, card-list, timeline, feed)

**Feedback & Status:**
- Indicators: (badge, chip, tag, status-dot, progress-bar, progress-ring, spinner, skeleton-loader)
- Notifications: (toast, alert, banner, modal, tooltip, popover)
- Empty States: (no-data, error-state, loading-state)

**Layout Components:**
- Containers: (card, panel, sidebar, header, footer, grid-layout, flex-layout)
- Content: (hero-section, feature-grid, pricing-table, testimonial, stats-grid)

**Visual Patterns:**
- Themes: (dark-mode, light-mode, high-contrast)
- Styles: (rounded-corners, sharp-edges, shadows, borders, gradients)
- Spacing: (compact-layout, spacious-layout, dense-grid)

FILENAME CONTEXT: "${filename}"

Identify 4-6 SPECIFIC components you can actually see. Be precise about component types and variations.

Examples:
- Instead of "button" → "primary-button", "ghost-button", "icon-button"
- Instead of "chart" → "donut-chart", "line-chart", "bar-chart"
- Instead of "card" → "metric-card", "user-card", "product-card"
- Instead of "list" → "avatar-list", "notification-list", "menu-list"

Return ONLY the component names separated by commas, no quotes, no other text.`,
                  },
                  {
                    type: "image",
                    image: imageUrl,
                  },
                ],
              },
            ],
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout after 30 seconds")), 30000),
          ),
        ])

        const tags = text
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .map((tag) => tag.replace(/^["'`]+|["'`]+$/g, "")) // Remove quotes
          .map((tag) => tag.replace(/```.*$/, "")) // Remove code blocks
          .filter((tag) => tag.length > 0 && tag.length < 25)
          .filter((tag) => !tag.includes("\n")) // Remove tags with line breaks
          .slice(0, 6)

        console.log(`[v0] Successfully generated tags: ${tags.join(", ")}`)
        return NextResponse.json({ tags })
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")
        console.log(`[v0] Attempt ${attempt} failed:`, lastError.message)

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
          console.log(`[v0] Retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    console.log(`[v0] All attempts failed, generating fallback tags for: ${filename}`)
    const fallbackTags = generateFallbackTags(filename)

    return NextResponse.json(
      {
        tags: fallbackTags,
        error: `Failed after ${maxRetries} attempts: ${lastError?.message}`,
        fallback: true,
      },
      { status: 200 },
    ) // Return 200 with fallback tags instead of 500
  } catch (error) {
    console.error("Failed to generate tags:", error)
    return NextResponse.json(
      {
        tags: ["design", "ui"],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
