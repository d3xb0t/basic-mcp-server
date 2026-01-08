# MCP Tutorial

**MCP (Model Context Protocol) Tutorial** is an example project that demonstrates basic concepts of inter-process communication using an RPC-style (Remote Procedure Call) protocol via STDIO.

## ⚠️ Important Warning

This project is **NOT designed for production use**. It is an example implementation for exploring concepts of inter-process communication, RPC protocols, and microservice architecture. Its use in production environments is not recommended without significant modifications and reviews.

## Description

This project demonstrates a simple implementation of a communication system based on the MCP (Model Context Protocol), which allows remote procedure execution via STDIO. The system includes:

- An MCP server ([mcp-server-prod.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-server-prod.js)) that listens and processes requests
- An MCP client ([mcp-client.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-client.js)) that sends requests to the server
- An HTTP API ([api.mcp.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/api.mcp.js)) that acts as a bridge between HTTP requests and the MCP server
- An asynchronous MCP server ([async-mcp-server-prod.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/async-mcp-server-prod.js)) with Ollama integration
- Additional server examples ([mcp-server-v2.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-server-v2.js) and [mcp-eco.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-eco.js))

## Concepts Explored

- Inter-process communication (IPC) using STDIO
- Basic JSON-RPC 2.0 protocol
- Asynchronous client-server communication
- Implementation of remote methods
- Error handling in inter-process communication
- HTTP to custom protocol bridge
- Integration with external services (Ollama API)

## MCP Protocol Specifics

This implementation does not use the standard MCP handshake because the communication occurs via STDIO. The handshake mechanism is typically required for HTTP-based MCP servers to establish the connection and negotiate capabilities. In STDIO-based implementations like this one, the client and server processes are already connected through the standard input/output streams, eliminating the need for an initial handshake.

In HTTP-based MCP implementations, the handshake is necessary to:
- Establish the connection
- Negotiate protocol versions
- Exchange capability information
- Authenticate the connection

## Project Structure

- [api.mcp.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/api.mcp.js) - HTTP API that acts as a bridge to the MCP server
- [mcp-client.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-client.js) - MCP client that communicates with the server via STDIO
- [mcp-server-prod.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-server-prod.js) - MCP server that processes RPC requests
- [async-mcp-server-prod.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/async-mcp-server-prod.js) - Asynchronous MCP server with Ollama integration
- [mcp-server-v2.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-server-v2.js) - Alternative version of the MCP server
- [mcp-eco.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-eco.js) - Additional MCP server example
- [tools.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/tools.js) - Shared methods implementation including Ollama API integration
- [test-client-mcp.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/test-client-mcp.js) - Test client to demonstrate functionality

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Run the MCP server directly:
```bash
node mcp-server-prod.js
```

3. Run the HTTP API:
```bash
node api.mcp.js
```

## Usage

Once the HTTP API is running, you can make POST requests to `/mcp/call`:

```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "ping", "params": {}}'
```

Or to use the `math.add` method:

```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "math.add", "params": {"a": 5, "b": 3}}'
```

### Ollama Integration

The async server includes integration with Ollama for AI text completion. To use this feature:

```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "ollama.complete", "params": {"prompt": "Explain quantum computing", "model": "gemma3:1b"}}'
```

Make sure you have Ollama running locally on port 11434 with the specified model available.

### Testing with the Test Client

You can run the test client to verify functionality:

```bash
node test-client-mcp.js
```

## Available Methods

- `ping` - Returns 'pong'
- `math.add` - Adds two numbers (params: a, b)
- `ollama.complete` - Generates text using Ollama (params: prompt, model, stream)
- `echo.upper` - Converts text to uppercase (in mcp-eco.js)
- `string.reverse` - Reverses a string (in mcp-server-v2.js)
- `time.now` - Returns current time in ISO format (in mcp-server-v2.js)

## Limitations

- Not optimized for high performance
- No authentication or authorization included
- No load handling or rate limiting
- No automated tests included
- No audit logging or detailed logs
- Not designed for production environments

## Contributions

Contributions are welcome to improve documentation or explore more concepts related to inter-process communication and RPC protocols.