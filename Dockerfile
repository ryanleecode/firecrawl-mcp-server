# Build stage - Use official Bun image for optimal performance
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* pnpm-lock.yaml* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build standalone executable using Bun's native compilation
# This runs the copy-package-json script and compiles the main.ts file
RUN bun run build

# Production stage - Use slim image for better tooling availability while maintaining security
FROM debian:12-slim AS production

# Install minimal runtime dependencies for health checks
RUN apt-get update && \
  apt-get install -y --no-install-recommends netcat-traditional procps && \
  rm -rf /var/lib/apt/lists/* && \
  groupadd -r nonroot && \
  useradd -r -g nonroot nonroot

WORKDIR /app

# Copy the compiled executable and health check script from builder stage
COPY --from=builder /app/dist/firecrawl-mcp ./firecrawl-mcp
COPY --from=builder /app/healthcheck.sh ./healthcheck.sh

# Make executables runnable
RUN chmod +x ./firecrawl-mcp ./healthcheck.sh

# Run as non-root user for security
USER nonroot:nonroot

# Add labels for the project
LABEL org.opencontainers.image.title="firecrawl-mcp"
LABEL org.opencontainers.image.description="Firecrawl MCP Server - supports both stdio and HTTP transports for web scraping integration"
LABEL org.opencontainers.image.vendor="ryanleecode"
LABEL org.opencontainers.image.source="https://github.com/ryanleecode/firecrawl-mcp-server"
LABEL org.opencontainers.image.licenses="MIT"

# Environment variables for transport configuration
ENV TRANSPORT=stdio
ENV PORT=3000

# Expose port for HTTP mode (conditional on TRANSPORT=http)
EXPOSE 3000

# Health check that adapts to the transport mode
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ./healthcheck.sh

# Start the MCP server (transport mode controlled by TRANSPORT env var)
CMD ["./firecrawl-mcp"]
