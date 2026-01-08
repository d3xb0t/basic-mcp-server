// mcp-server-prod.js
// MCP (Message Client Protocol) server that processes requests via STDIO
// Implements a simple JSON-based RPC protocol for executing remote methods

import { createInterface } from 'node:readline'
import { stdout, stdin } from 'node:process'
import { methods } from './tools.js'

/**
 * Sends a response to the MCP client via stdout
 * 
 * Only send if it's a response (has id) because in the RPC protocol:
 * - Requests with ID require a response (method calls)
 * - Requests without ID are notifications (don't need a response)
 * 
 * @param {Object} response - Response object in JSON-RPC format
 * @returns {void}
 */
const sendResponse = (response) => {
    // Only send if it's a response (has id)
    if (response.id !== undefined) {
        stdout.write(JSON.stringify(response) + '\n')
    }
}


/**
 * Handles an incoming request from the MCP client
 * 
 * Processes the requested method, validates its existence, and responds according to the JSON-RPC 2.0 protocol
 * 
 * @param {Object} request - Incoming request in JSON-RPC format
 * @param {string} request.method - Name of the method to invoke
 * @param {any} request.params - Parameters for the method (optional)
 * @param {number|string|undefined} request.id - Request ID (if it doesn't exist, it's a notification)
 * @returns {void}
 */
const handleRequest = async (request) => {
    const { method, id, params = {} } = request;
    const isNotification = id === undefined;

    const handler = methods[method];
    if (!handler) {
        if (!isNotification) {
            sendResponse({
                jsonrpc: '2.0',
                error: { code: -32601, message: 'Method not found' },
                id,
            });
        }
        return;
    }

    try {
        const result = await handler(params); // ← await aquí
        if (!isNotification) {
            sendResponse({ jsonrpc: '2.0', result, id });
        }
    } catch (err) {
        if (!isNotification) {
            sendResponse({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Internal error',
                    data: err.message,
                },
                id,
            });
        }
    }
};

// Set up a readline interface to process STDIN line by line
// We use 'createInterface' to efficiently handle large or fragmented inputs
// 'crlfDelay: Infinity' prevents splitting lines that contain \r\n
const rl = createInterface({ input: stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
        const req = JSON.parse(line);
        if (req.jsonrpc === '2.0' && typeof req.method === 'string') {
            // No esperamos, pero evitamos que errores no capturados rompan todo
            handleRequest(req).catch(err => {
                console.error('Unhandled error in request:', err);
            });
        }
    } catch {
        // JSON inválido → ignorar
    }
});

// Clean shutdown handling to free resources
// This is important to prevent zombie processes and ensure proper shutdown
const cleanup = () => {
    rl.close();
    process.exit(0);
};

// Set up clean shutdowns on different events
// This ensures the server responds appropriately to system signals
stdin.on('end', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Resume stdin stream so the process doesn't terminate immediately
stdin.resume();