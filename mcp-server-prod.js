// mcp-server-prod.js
import { createInterface } from 'node:readline';
import { stdout, stdin } from 'node:process';

const sendResponse = (response) => {
    // Solo enviamos si es una respuesta (tiene id)
    if (response.id !== undefined) {
        stdout.write(JSON.stringify(response) + '\n');
    }
};

const methods = {
    'math.add': (params) => {
        if (typeof params.a !== 'number' || typeof params.b !== 'number') {
            throw new Error('Both "a" and "b" must be numbers');
        }
        return params.a + params.b;
    },
    'ping': () => 'pong',
};

const handleRequest = (request) => {
    const { method, id, params = {} } = request;

    // Notificación: no tiene id → no respondemos
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
        const result = handler(params);
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

// Manejador robusto de líneas
const rl = createInterface({ input: stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
        const req = JSON.parse(line);
        if (req.jsonrpc === '2.0' && typeof req.method === 'string') {
            handleRequest(req);
        }
    } catch {
        // Silencioso ante JSON mal formado (opcional: loggear en stderr)
    }
});

// Manejo de cierre limpio
const cleanup = () => {
    rl.close();
    process.exit(0);
};

stdin.on('end', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

stdin.resume();