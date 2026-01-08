// test-client.js
import { createMcpClient } from './mcp-client.js';

/**
 * Main function to test the MCP client functionality
 * This function tests ping, math.add, and an invalid method call
 */
const main = async () => {
    // Asegúrate de que esta ruta apunte a tu servidor funcional
    const client = createMcpClient('./mcp-server-prod.js');

    try {
        console.log('📡 Enviando ping...');
        const ping = await client.call('ping');
        console.log('✅ Respuesta:', ping);

        console.log('🧮 Sumando 7 + 13...');
        const sum = await client.call('math.add', { a: 7, b: 13 });
        console.log('✅ Respuesta:', sum);

        // Ejemplo con error
        console.log('❌ Probando método inexistente...');
        const bad = await client.call('unknown.method');
        console.log('Resultado (no debería verse):', bad);
    } catch (err) {
        console.error('❌ Error capturado:', err.message);
    } finally {
        console.log('🔌 Cerrando cliente...');
        client.close();
    }
};

main().catch(console.error);