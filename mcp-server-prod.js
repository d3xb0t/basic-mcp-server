// mcp-server-prod.js
// MCP (Message Client Protocol) server that processes requests via STDIO
// Implements a simple JSON-based RPC protocol for executing remote methods

import { createInterface } from 'node:readline';
import { stdout, stdin } from 'node:process';

/**
 * Sends a response to the MCP client via stdout
 * 
 * Only send if it's a response (has id) because in the RPC protocol:
 * - Requests with ID require a response (method calls)
 * - Requests without ID are notifications (don't need a response)
 * 
 * @param {Object} response - Response object in JSON-RPC format
 */
const sendResponse = (response) => {
    // Only send if it's a response (has id)
    if (response.id !== undefined) {
        stdout.write(JSON.stringify(response) + '\n');
    }
};

// Definition of available methods in the server
// This structure allows easily adding new methods without changing the main logic
const methods = {
    /**
     * Method that adds two numbers
     * 
     * Validates that both parameters are numbers to prevent type errors
     * 
     * @param {Object} params - Input parameters
     * @param {number} params.a - First number
     * @param {number} params.b - Second number
     * @returns {number} The sum of a and b
     */
    'math.add': (params) => {
        if (typeof params.a !== 'number' || typeof params.b !== 'number') {
            throw new Error('Both "a" and "b" must be numbers');
        }
        return params.a + params.b;
    },
    
    /**
     * Simple ping method that responds with 'pong'
     * 
     * @returns {string} 'pong'
     */
    'ping': () => 'pong',
};

/**
 * Handles an incoming request from the MCP client
 * 
 * Processes the requested method, validates its existence, and responds according to the JSON-RPC 2.0 protocol
 * 
 * @param {Object} request - Incoming request in JSON-RPC format
 * @param {string} request.method - Name of the method to invoke
 * @param {any} request.params - Parameters for the method (optional)
 * @param {number|string|undefined} request.id - Request ID (if it doesn't exist, it's a notification)
 */
const handleRequest = (request) => {
    const { method, id, params = {} } = request;

    // Determine if the request is a notification (doesn't require response)
    // In the JSON-RPC protocol, notifications don't have an 'id' field
    const isNotification = id === undefined;

    const handler = methods[method];
    if (!handler) {
        // Only respond if it's not a notification
        // Notifications don't expect a response according to JSON-RPC protocol
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
        // Execute the method and get the result
        const result = handler(params);
        
        // Only respond if it's not a notification
        // This maintains compatibility with the JSON-RPC protocol
        if (!isNotification) {
            sendResponse({ jsonrpc: '2.0', result, id });
        }
    } catch (err) {
        // In case of error, respond with an error object
        // Only if it's not a notification (for the same reason as above)
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
        // Validate that it's a valid request with JSON-RPC 2.0 format
        if (req.jsonrpc === '2.0' && typeof req.method === 'string') {
            handleRequest(req);
        }
    } catch {
        // Silent on malformed JSON (optional: log to stderr)
        // Ignore invalid inputs to prevent errors in the server
    }
});

/**
 * Clean shutdown function to close resources properly
 * This is important to prevent zombie processes and ensure proper shutdown
 */
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