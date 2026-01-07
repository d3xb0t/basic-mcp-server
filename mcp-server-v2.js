// mcp-server-v2.js
import { createInterface } from 'node:readline';
import { stdout } from 'node:process';

//sendResponse recibe un JSON  y lo escribe en stdout
const sendResponse = (response) => {
    stdout.write(JSON.stringify(response) + '\n')
}


// Definimos "herramientas" o métodos disponibles
const methods = {
    'math.add': (params) => params.a + params.b,
    'string.reverse': (params) => String(params.text).split('').reverse().join(''),
    'time.now': () => new Date().toISOString(),
};


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

process.stdin.resume();