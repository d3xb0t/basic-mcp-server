# MCP Tutorial

**MCP (Model Context Protocol) Tutorial** is an example project that demonstrates basic concepts of inter-process communication using an RPC-style (Remote Procedure Call) protocol via STDIO.

## ⚠️ Important Warning

This project is **NOT designed for production use**. It is an example implementation for exploring concepts of inter-process communication, RPC protocols, and microservice architecture. Its use in production environments is not recommended without significant modifications and reviews.

## Description

This project demonstrates a simple implementation of a communication system based on the MCP (Model Context Protocol), which allows remote procedure execution via STDIO. The system includes:

- An MCP server ([mcp-server-prod.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-server-prod.js)) that listens and processes requests
- An MCP client ([mcp-client.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-client.js)) that sends requests to the server
- An HTTP API ([api.mcp.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/api.mcp.js)) that acts as a bridge between HTTP requests and the MCP server

## Concepts Explored

- Inter-process communication (IPC) using STDIO
- Basic JSON-RPC 2.0 protocol
- Asynchronous client-server communication
- Implementation of remote methods
- Error handling in inter-process communication
- HTTP to custom protocol bridge

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
- [mcp-server-v2.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-server-v2.js) - Alternative version of the MCP server
- [mcp-eco.js](file:///home/d3xb0t/Dev/MCP/STDIO/Tutorial/mcp-eco.js) - Additional MCP server example

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

## Limitations

- Not optimized for high performance
- No authentication or authorization included
- No load handling or rate limiting
- No automated tests included
- No audit logging or detailed logs
- Not designed for production environments

## Contributions

Contributions are welcome to improve documentation or explore more concepts related to inter-process communication and RPC protocols.