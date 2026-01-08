// api-mcp.js
// HTTP API that acts as a bridge between HTTP requests and the MCP server
// Allows accessing MCP methods through standard HTTP/JSON endpoints

import express from 'express';
import { createMcpClient } from './mcp-client.js';

// Path to the MCP server (adjust if located elsewhere)
// This configuration allows easily changing the server location
const MCP_SERVER_PATH = './async-mcp-server-prod.js';

// Create a *shared* client (you can change this if you want one per request)
// We use a shared client because:
// 1. The MCP server is stateless (doesn't maintain state between calls)
// 2. Reusing the client is more efficient than creating a new one per request
// 3. Reduces overhead of creating and destroying processes
const mcpClient = createMcpClient(MCP_SERVER_PATH);

// Error handler to close the client on exit
// It's important to close the client to prevent orphaned processes
const gracefulShutdown = () => {
    console.log('CloseOperation: Closing MCP client...');
    mcpClient.close();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

const app = express();
app.use(express.json());
// Main route to call MCP methods
app.post('/mcp/call', async (req, res) => {
    const { method, params } = req.body;

    // Minimum request validation
    // Check that the method name exists and is a string
    if (!method || typeof method !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "method"' });
    }

    try {
        // Call the MCP server to execute the requested method
        // Using await because MCP communication is asynchronous
        const response = await mcpClient.call(method, params);

        // If the MCP server returned an error in the protocol
        // Check if there's an error object in the response
        if (response.error) {
            return res.status(400).json({
                error: response.error.message,
                code: response.error.code,
            });
        }

        // Return only the result (clean)
        // Format the response to be consistent with HTTP protocol
        res.json({ result: response.result });
    } catch (err) {
        console.error('MCP Call Error:', err);
        res.status(500).json({ error: 'Internal MCP error', message: err.message });
    }
});

// Health route (optional)
// Endpoint to verify that the service is running and operational
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mcp: 'connected' });
});

// Start HTTP server on the configured port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ HTTP MCP API running on http://localhost:${PORT}`);
    console.log(`   → Use POST /mcp/call to invoke MCP methods`);
});