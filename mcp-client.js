// mcp-client.js
// MCP (Message Client Protocol) client that communicates with an MCP server via STDIO
// Uses a child process to execute the MCP server and communicates via JSON messages

import { spawn } from 'node:child_process';

/**
 * Creates an MCP client that connects to a server via STDIO
 * 
 * The reason for using STDIO as transport is that MCP is a simple line-based message protocol
 * that allows efficient communication between processes, ideal for microservices or CLI tools
 * 
 * @param {string} serverPath - Path to the MCP server file
 * @returns {Object} An object with 'call' and 'close' methods to invoke methods and close the connection
 */
const createMcpClient = (serverPath) => {
    // Create a child process that runs the MCP server
    // We use custom stdio: pipes for stdin/stdout, inherit stderr to keep logs
    const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'inherit'], // stdin and stdout as pipes; stderr inherited
    });

    // Configure encoding so data arrives as strings
    child.stdin.setEncoding('utf-8');
    child.stdout.setEncoding('utf-8');

    // Buffer to handle stdout fragments (in case a response is split into chunks)
    // This is important because in high-speed systems or with latency, a response
    // may arrive split across multiple 'data' events
    let buffer = '';

    // Map of pending callbacks: id → resolution function
    // We use a map to correlate responses with their original requests
    // This allows multiple concurrent requests without confusion
    const pendingRequests = new Map();

    // Listen to server output
    child.stdout.on('data', (chunk) => {
        buffer += chunk;
        let newlineIndex;
        // Process line by line (MCP responses are delimited by newlines)
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (!line.trim()) continue;

            try {
                const msg = JSON.parse(line);
                // Is it a response? (has id)
                if (msg.id !== undefined) {
                    const resolve = pendingRequests.get(msg.id);
                    if (resolve) {
                        resolve(msg); // deliver entire response (result or error)
                        pendingRequests.delete(msg.id);
                    }
                }
                // If it's a notification (no id), you could emit an event, but we ignore it for now
            } catch (err) {
                // Optionally log parsing errors
            }
        }
    });

    /**
     * Sends a request to the MCP server and waits for a response
     * 
     * We implement a promise system with unique IDs to allow concurrent requests
     * Each request is identified with a unique ID that's included in the response
     * 
     * @param {string} method - Name of the MCP method to invoke
     * @param {Object} params - Parameters for the method (optional)
     * @returns {Promise} Promise that resolves with the server response
     */
    const call = (method, params = {}) => {
        return new Promise((resolve, reject) => {
            // Generate a unique ID to correlate the request with the response
            // We combine timestamp and random number to reduce collisions
            const id = Date.now() + Math.random(); 
            const request = { jsonrpc: '2.0', method, params, id };

            // Save the resolve function for when the response arrives
            pendingRequests.set(id, resolve);

            // Send the message with a newline as delimiter
            // The delimiter is important for the server to correctly parse
            child.stdin.write(JSON.stringify(request) + '\n');
        });
    };

    /**
     * Closes the client and terminates the child process
     * 
     * It's important to close the client to prevent orphaned processes
     */
    const close = () => {
        child.kill();
    };

    // Handle errors from the child process
    child.on('error', (err) => {
        console.error('MCP Client process error:', err);
    });

    child.on('close', (code) => {
        // If the process dies unexpectedly, reject all pending promises
        // to prevent them from waiting indefinitely
        for (const reject of pendingRequests.values()) {
            reject(new Error(`MCP server closed unexpectedly (code ${code})`));
        }
        pendingRequests.clear();
    });

    return { call, close };
};

export { createMcpClient }