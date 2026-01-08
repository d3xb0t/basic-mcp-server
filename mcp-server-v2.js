// mcp-server-v2.js
import { createInterface } from 'node:readline';
import { stdout } from 'node:process';

/**
 * Sends a response to the MCP client via stdout
 * 
 * @param {Object} response - Response object in JSON-RPC format
 */
const sendResponse = (response) => {
    stdout.write(JSON.stringify(response) + '\n')
}

// Definimos "herramientas" o métodos disponibles
const methods = {
    'math.add': (params) => params.a + params.b,
    'string.reverse': (params) => String(params.text).split('').reverse().join(''),
    'time.now': () => new Date().toISOString(),
};

/**
 * Handles an incoming request from the MCP client
 * 
 * @param {Object} request - Incoming request in JSON-RPC format
 * @param {string} request.method - Name of the method to invoke
 * @param {any} request.params - Parameters for the method (optional)
 * @param {number|string|undefined} request.id - Request ID (if it doesn't exist, it's a notification)
 */
const handleRequest = (request) => {
    const { method, id } = request;
    const handler = methods[method];

    if (!handler) {
        sendResponse({
            jsonrpc: '2.0',
            error: { code: -32601, message: 'Method not found' },
            id,
        });
        return;
    }

    try {
        const result = handler(request.params || {});
        sendResponse({ jsonrpc: '2.0', result, id });
    } catch (err) {
        sendResponse({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Internal error', data: err.message },
            id,
        });
    }
};

// Set up a readline interface to process STDIN line by line
// We use 'createInterface' to efficiently handle large or fragmented inputs
// 'crlfDelay: Infinity' prevents splitting lines that contain \r\n
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
    try {
        const req = JSON.parse(line.trim());
        if (req.jsonrpc !== '2.0') return; // ignoramos versiones distintas
        handleRequest(req);
    } catch {
        // silencioso ante JSON inválido
    }
});

// Resume stdin stream so the process doesn't terminate immediately
process.stdin.resume();