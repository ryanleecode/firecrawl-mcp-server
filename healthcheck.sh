#!/bin/bash

# Health check script for Firecrawl MCP Server
# Adapts to both stdio and HTTP transport modes

set -e

if [ "$TRANSPORT" = "http" ]; then
    # For HTTP mode, check if the HTTP server is responding on the configured port
    echo "Checking HTTP mode health on port ${PORT:-3000}"
    nc -z localhost ${PORT:-3000} || {
        echo "HTTP health check failed: port ${PORT:-3000} not responding"
        exit 1
    }
    echo "HTTP mode: port ${PORT:-3000} is responding"
else
    # For stdio mode, check if the firecrawl-mcp process is running
    echo "Checking stdio mode health"
    if pgrep -f "firecrawl-mcp" > /dev/null; then
        echo "Stdio mode: firecrawl-mcp process is running"
    else
        echo "Stdio mode health check failed: firecrawl-mcp process not found"
        exit 1
    fi
fi

echo "Health check passed for transport mode: ${TRANSPORT:-stdio}"
