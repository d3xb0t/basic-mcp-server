// mcp-server-prod.js
import { createInterface } from 'node:readline';
import { stdout, stdin } from 'node:process';
import { initKnowledgeBase, createMethods } from './tools.js';

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

const cleanup = () => {
    rl.close();
    process.exit(0);
};

stdin.on('end', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

stdin.resume();