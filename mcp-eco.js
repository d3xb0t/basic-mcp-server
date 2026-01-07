// mcp-eco.js
import { createInterface } from 'node:readline';
import { stdout } from 'node:process';

// Helper para escribir un mensaje JSON en stdout
const sendResponse = (response) => {
    const msg = JSON.stringify(response);
    stdout.write(`${msg}\n`);
};

// Manejador de mensajes entrantes
const handleRequest = (request) => {
    // Solo aceptamos método "echo.upper"
    if (request.method === 'echo.upper') {
        const input = request.params?.text ?? '';
        const result = String(input).toUpperCase();
        sendResponse({
            jsonrpc: '2.0',
            result,
            id: request.id,
        });
    } else {
        sendResponse({
            jsonrpc: '2.0',
            error: { code: -32601, message: 'Method not found' },
            id: request.id,
        });
    }
};

// Configurar lectura de líneas desde stdin
const rl = createInterface({
    input: process.stdin,
    crlfDelay: Infinity, // trata \r\n como una sola línea
});

// Cada línea es un mensaje JSON
rl.on('line', (line) => {
    try {
        const req = JSON.parse(line.trim());
        handleRequest(req);
    } catch (err) {
        // Si el JSON está mal, no respondemos (o podrías enviar error si quieres)
    }
});

// Prevenir que el proceso muera si no hay input
process.stdin.resume();