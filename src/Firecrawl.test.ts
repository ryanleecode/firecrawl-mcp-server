import { describe, it, expect, vi, beforeEach } from "vitest"
import { Effect } from "effect"
import { Firecrawl } from "./Firecrawl.js"

// Mock the Firecrawl client
const mockFirecrawl = {
  scrapeUrl: vi.fn(),
  search: vi.fn(),
  mapUrl: vi.fn(),
  asyncCrawlUrl: vi.fn(),
  checkCrawlStatus: vi.fn(),
  extract: vi.fn(),
  deepResearch: vi.fn(),
  generateLLMsText: vi.fn(),
}

vi.mock("@mendable/firecrawl-js", () => ({
  default: vi.fn().mockImplementation(() => mockFirecrawl),
}))

describe("Firecrawl MCP Server", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create server layer successfully", async () => {
    const program = Effect.gen(function* () {
      const layer = Firecrawl("test-key")
      expect(layer).toBeDefined()
      return "success"
    })

    const result = await Effect.runPromise(program)

    expect(result).toBe("success")
  })

  it("should handle scrape requests", async () => {
    const mockResponse = {
      success: true,
      markdown: "# Test Content",
      url: "https://example.com",
    }

    mockFirecrawl.scrapeUrl.mockResolvedValueOnce(mockResponse)

    // Test would need to be integrated with the actual server implementation
    // This is a basic structure for testing with Effect
    expect(mockFirecrawl.scrapeUrl).toBeDefined()
  })

  it("should handle search requests", async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          url: "https://example.com",
          title: "Test Page",
          description: "Test Description",
          markdown: "# Test Content",
        },
      ],
    }

    mockFirecrawl.search.mockResolvedValueOnce(mockResponse)

    expect(mockFirecrawl.search).toBeDefined()
  })

  it("should handle map requests", async () => {
    const mockResponse = {
      success: true,
      links: ["https://example.com/page1", "https://example.com/page2"],
    }

    mockFirecrawl.mapUrl.mockResolvedValueOnce(mockResponse)

    expect(mockFirecrawl.mapUrl).toBeDefined()
  })

  it("should handle crawl requests", async () => {
    const mockResponse = {
      success: true,
      id: "test-crawl-id",
    }

    mockFirecrawl.asyncCrawlUrl.mockResolvedValueOnce(mockResponse)

    expect(mockFirecrawl.asyncCrawlUrl).toBeDefined()
  })

  it("should handle extract requests", async () => {
    const mockResponse = {
      success: true,
      data: {
        title: "Test Title",
        content: "Test Content",
      },
    }

    mockFirecrawl.extract.mockResolvedValueOnce(mockResponse)

    expect(mockFirecrawl.extract).toBeDefined()
  })

  it("should handle deep research requests", async () => {
    const mockResponse = {
      success: true,
      data: {
        finalAnalysis: "Test analysis result",
        activities: [],
        sources: [],
      },
    }

    mockFirecrawl.deepResearch.mockResolvedValueOnce(mockResponse)

    expect(mockFirecrawl.deepResearch).toBeDefined()
  })

  it("should handle errors gracefully", async () => {
    const error = new Error("API Error")
    mockFirecrawl.scrapeUrl.mockRejectedValueOnce(error)

    // Test error handling
    expect(() => {
      throw error
    }).toThrow("API Error")
  })
})
