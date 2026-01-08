# MCP Tutorial

**MCP (Model Context Protocol) Tutorial** is an example project that demonstrates basic concepts of inter-process communication using an RPC-style (Remote Procedure Call) protocol via STDIO.

## ⚠️ Important Warning

This project is **NOT designed for production use**. It is an example implementation for exploring concepts of inter-process communication, RPC protocols, and microservice architecture. Its use in production environments is not recommended without significant modifications and reviews.

## Description

This project demonstrates a simple implementation of a communication system based on the MCP (Model Context Protocol), which allows remote procedure execution via STDIO. The system provides various capabilities including:

- Basic remote procedure calls
- Asynchronous communication patterns
- HTTP integration for web-based access
- AI integration through external services
- Error handling and robust communication

## MCP Protocol Specifics

This implementation does not use the standard MCP handshake because the communication occurs via STDIO. The handshake mechanism is typically required for HTTP-based MCP servers to establish the connection and negotiate capabilities. In STDIO-based implementations like this one, the client and server processes are already connected through the standard input/output streams, eliminating the need for an initial handshake.

In HTTP-based MCP implementations, the handshake is necessary to:
- Establish the connection
- Negotiate protocol versions
- Exchange capability information
- Authenticate the connection

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

## Comprehensive cURL Test Examples

Here are all the necessary test examples using cURL for different methods available in the system:

### Basic Methods

**Ping method:**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "ping", "params": {}}'
```

**Math addition:**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "math.add", "params": {"a": 10, "b": 15}}'
```

**Error test (invalid method):**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "nonexistent.method", "params": {}}'
```

**Error test (invalid parameters):**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "math.add", "params": {"a": "text", "b": 5}}'
```

### Methods from mcp-server-v2.js

**String reverse:**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "string.reverse", "params": {"text": "hello"}}'
```

**Time now:**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "time.now", "params": {}}'
```

### Methods from mcp-eco.js

**Echo uppercase:**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "echo.upper", "params": {"text": "hello world"}}'
```

### Advanced Methods with Ollama Integration

**Ollama text completion:**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "ollama.complete", "params": {"prompt": "Explain quantum computing in simple terms", "model": "phi3:mini"}}'
```

**RAG (Retrieval-Augmented Generation) query:**
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"method": "rag.query", "params": {"query": "What is the Model Context Protocol?"}}'
```

**Health check for the API:**
```bash
curl -X GET http://localhost:3000/health
```

## Available Methods

- `ping` - Returns 'pong'
- `math.add` - Adds two numbers (params: a, b)
- `ollama.complete` - Generates text using Ollama (params: prompt, model, stream)
- `echo.upper` - Converts text to uppercase (in mcp-eco.js)
- `string.reverse` - Reverses a string (in mcp-server-v2.js)
- `time.now` - Returns current time in ISO format (in mcp-server-v2.js)
- `rag.query` - Performs RAG (Retrieval-Augmented Generation) query using knowledge base

## Limitations

- Not optimized for high performance
- No authentication or authorization included
- No load handling or rate limiting
- No automated tests included
- No audit logging or detailed logs
- Not designed for production environments

## Contributions

Contributions are welcome to improve documentation or explore more concepts related to inter-process communication and RPC protocols.