#!/usr/bin/env bun
import { McpServer } from "@effect/ai"
import { Command } from "@effect/cli"
import {
  BunHttpServer,
  BunRuntime,
  BunSink,
  BunStream,
  BunContext,
} from "@effect/platform-bun"
import { Config, Effect, Layer, Logger, Redacted } from "effect"
import { Firecrawl } from "./Firecrawl.js"
import { HttpRouter } from "@effect/platform"

const apiKeyConfig = Config.redacted("FIRECRAWL_API_KEY")
const apiUrlConfig = Config.option(Config.string("FIRECRAWL_API_URL"))
const transportConfig = Config.withDefault(
  Config.literal("stdio", "http")("TRANSPORT"),
  "stdio" as const,
)
const portConfig = Config.withDefault(Config.integer("PORT"), 3000)

// Main server program that adapts to transport mode
const program = Effect.gen(function* () {
  const apiKey = yield* apiKeyConfig
  const apiUrl = yield* apiUrlConfig
  const transport = yield* transportConfig
  const port = yield* portConfig

  if (transport === "http") {
    yield* Effect.log(
      `🔧 Starting Firecrawl MCP server with HTTP on port ${port}...`,
    )

    // Create the server layer using SSE transport
    const ServerLayer = Layer.mergeAll(
      Firecrawl(
        Redacted.value(apiKey),
        apiUrl._tag === "Some" ? apiUrl.value : undefined,
      ),
      HttpRouter.Default.serve(),
    ).pipe(
      Layer.provide(
        McpServer.layerHttp({
          name: "firecrawl-mcp",
          version: "1.12.0",
          path: "/mcp",
        }),
      ),
      Layer.provide(BunHttpServer.layer({ port })),
      Layer.provide(BunHttpServer.layerContext),
      Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))),
    )

    yield* Effect.log(
      `🚀 Firecrawl MCP server running on HTTP at http://localhost:${port}/mcp`,
    )

    return yield* Layer.launch(ServerLayer)
  } else {
    yield* Effect.log(`🔧 Starting Firecrawl MCP server with stdio...`)

    // Create the server layer using stdio transport
    const ServerLayer = Layer.mergeAll(
      Firecrawl(
        Redacted.value(apiKey),
        apiUrl._tag === "Some" ? apiUrl.value : undefined,
      ),
    ).pipe(
      Layer.provide(
        McpServer.layerStdio({
          name: "firecrawl-mcp",
          version: "1.12.0",
          stdin: BunStream.stdin,
          stdout: BunSink.stdout,
        }),
      ),
      Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))),
    )

    yield* Effect.log(`🚀 Firecrawl MCP server running on stdio`)

    return yield* Layer.launch(ServerLayer)
  }
})

// Main CLI command - default runs the server
const mainCommand = Command.make("firecrawl-mcp", {}, () => program)

const cli = Command.run(mainCommand, {
  name: "Firecrawl MCP Server",
  version: "1.12.0",
})

const cliProgram = cli(Bun.argv).pipe(
  Effect.provide(BunContext.layer),
  Effect.scoped,
)

BunRuntime.runMain(cliProgram)
