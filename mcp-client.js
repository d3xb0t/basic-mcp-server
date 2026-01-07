// mcp-client.js
import { spawn } from 'node:child_process';

// Crea un cliente MCP que se conecta a tu servidor por STDIO
const createMcpClient = (serverPath) => {
    const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'inherit'], // stdin y stdout como pipes; stderr heredado
    });

    // Configurar encoding para que los datos lleguen como strings
    child.stdin.setEncoding('utf-8');
    child.stdout.setEncoding('utf-8');

    // Buffer para manejar fragmentos de stdout (por si una respuesta se divide en trozos)
    let buffer = '';

    // Mapa de callbacks pendientes: id → función de resolución
    const pendingRequests = new Map();

    // Escuchar salida del servidor
    child.stdout.on('data', (chunk) => {
        buffer += chunk;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (!line.trim()) continue;

            try {
                const msg = JSON.parse(line);
                // Es una respuesta?
                if (msg.id !== undefined) {
                    const resolve = pendingRequests.get(msg.id);
                    if (resolve) {
                        resolve(msg); // entrega toda la respuesta (result o error)
                        pendingRequests.delete(msg.id);
                    }
                }
                // Si es notificación (sin id), podrías emitir un evento, pero lo ignoramos por ahora
            } catch (err) {
                // Opcional: loggear errores de parsing
            }
        }
    });

    // Función para enviar una solicitud y esperar respuesta
    const call = (method, params = {}) => {
        return new Promise((resolve, reject) => {
            const id = Date.now() + Math.random(); // ID único (puedes mejorar esto si quieres)
            const request = { jsonrpc: '2.0', method, params, id };

            // Guardamos el resolve para cuando llegue la respuesta
            pendingRequests.set(id, resolve);

            // Enviamos el mensaje
            child.stdin.write(JSON.stringify(request) + '\n');
        });
    };

    // Función para cerrar el cliente
    const close = () => {
        child.kill();
    };

    // Manejo de errores del proceso hijo
    child.on('error', (err) => {
        console.error('MCP Client process error:', err);
    });

    child.on('close', (code) => {
        // Opcional: limpiar pendingRequests si el proceso muere
        for (const reject of pendingRequests.values()) {
            reject(new Error(`MCP server closed unexpectedly (code ${code})`));
        }
        pendingRequests.clear();
    });

    return { call, close };
};

export { createMcpClient }