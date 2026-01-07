// api-mcp.js
import express from 'express';
import { createMcpClient } from './mcp-client.js';

// Ruta de tu servidor MCP (ajusta si está en otra carpeta)
const MCP_SERVER_PATH = './mcp-server-prod.js';

// Creamos un cliente *compartido* (puedes cambiar esto si quieres uno por request)
// Nota: si el servidor MCP es stateless (como el tuyo), reutilizar es seguro y eficiente.
const mcpClient = createMcpClient(MCP_SERVER_PATH);

// Manejador de errores para cerrar el cliente al salir
const gracefulShutdown = () => {
    console.log('CloseOperation: Cerrando cliente MCP...');
    mcpClient.close();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Creamos la app Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta principal para llamar métodos MCP
app.post('/mcp/call', async (req, res) => {
    const { method, params } = req.body;

    // Validación mínima
    if (!method || typeof method !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "method"' });
    }

    try {
        // Llamamos al servidor MCP
        const response = await mcpClient.call(method, params);

        // Si el servidor MCP devolvió un error en el protocolo
        if (response.error) {
            return res.status(400).json({
                error: response.error.message,
                code: response.error.code,
            });
        }

        // Devolvemos solo el resultado (limpio)
        res.json({ result: response.result });
    } catch (err) {
        console.error('MCP Call Error:', err);
        res.status(500).json({ error: 'Internal MCP error', message: err.message });
    }
});

// Ruta de salud (opcional)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mcp: 'connected' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ API MCP HTTP corriendo en http://localhost:${PORT}`);
    console.log(`   → Usa POST /mcp/call para invocar métodos MCP`);
});