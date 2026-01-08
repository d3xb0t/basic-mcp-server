// mcp-server-prod.js
import { createInterface } from 'node:readline';
import { stdout, stdin } from 'node:process';
import { initKnowledgeBase, createMethods } from './tools.js';

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
    if (response.id !== undefined) {
        stdout.write(JSON.stringify(response) + '\n');
    }
};

// Inicializamos la base y creamos los métodos
let methods = {};

initKnowledgeBase()
    .then(() => {
        methods = createMethods();
        console.log('🚀 Métodos MCP listos para recibir solicitudes.');
    })
    .catch(err => {
        console.error('❌ Error al inicializar:', err);
    });

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
        const result = await handler(params);
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
            handleRequest(req).catch(err => {
                console.error('Error handling request:', err);
            });
        }
    } catch {
        // JSON inválido → ignorar
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