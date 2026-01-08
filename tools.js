// tools.js
// Métodos MCP con soporte para RAG usando Ollama

let knowledgeBase = [];

/**
 * Calcula la similitud de coseno entre dos vectores
 * @param {number[]} a - Primer vector
 * @param {number[]} b - Segundo vector
 * @returns {number} Similitud entre -1 y 1
 */
const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) return -1;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Initializes the knowledge base with text embeddings from Ollama
 * This function fetches embeddings for pre-defined text snippets and stores them
 * in the knowledge base for RAG functionality
 * 
 * @returns {Promise<void>}
 */
const initKnowledgeBase = async () => {
    const texts = [
        'The Model Context Protocol (MCP) is a JSON-RPC-based protocol that enables editors and IDEs to communicate with local servers for AI, data access, and tool integration.',

        'MCP uses STDIO as its default transport layer, where each JSON-RPC message is sent as a single newline-terminated line over stdin/stdout.',

        'In MCP, method calls require an "id" field and expect a response, while notifications omit "id" and do not require a reply.',

        'Ollama is a local LLM runner that supports models like Llama, Mistral, Gemma, and Qwen. It provides REST APIs for /api/generate and /api/embeddings.',

        'To generate text with Ollama, send a POST request to http://localhost:11434/api/generate with "model", "prompt", and "stream" fields.',

        'To create embeddings with Ollama, send a POST request to http://localhost:11434/api/embeddings with "model" and "prompt" fields. The response contains an "embedding" array.',

        'RAG (Retrieval-Augmented Generation) combines semantic search with LLM generation: first retrieve relevant context, then generate an answer using that context.',

        'Cosine similarity measures the angle between two embedding vectors. Values close to 1.0 indicate high semantic similarity.',

        'The "all-minilm" model is a lightweight, reliable embedding model in Ollama, ideal for local RAG applications.',

        'When using Ollama embeddings, always use the "prompt" field (not "input") in the API request body to avoid empty embeddings.',

        'A robust MCP server should handle both synchronous and asynchronous methods, validate parameters, and manage errors gracefully without crashing.',

        'Embeddings should be precomputed and cached to avoid repeated calls to Ollama during initialization or query time.',
    ];

    console.log('🧠 Generando embeddings con nomic-embed-text...');

    for (const text of texts) {
        const response = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'nomic-embed-text:v1.5', prompt: text }),
        });

        if (!response.ok) {
            throw new Error(`Error al generar embedding para: "${text}" (${response.status})`);
        }

        const data = await response.json();
        if (!data.embedding || !Array.isArray(data.embedding)) {
            throw new Error(`Respuesta inválida de embeddings para: "${text}"`);
        }

        knowledgeBase.push({ text, embedding: data.embedding });
    }

    console.log('✅ Base de conocimiento lista con', knowledgeBase.length, 'documentos.');
};

/**
 * Crea el mapa de métodos MCP
 * @returns {Object} Métodos disponibles
 */
const createMethods = () => ({
    'math.add': (params) => {
        if (typeof params.a !== 'number' || typeof params.b !== 'number') {
            throw new Error('Both "a" and "b" must be numbers');
        }
        return params.a + params.b;
    },

    'ping': () => 'pong',

    /**
     * Generates text completion using Ollama
     * 
     * @param {Object} params - Parameters for the completion
     * @param {string} params.prompt - Input prompt for text generation
     * @param {string} [params.model='phi3:mini'] - Model to use for generation
     * @param {boolean} [params.stream=false] - Whether to stream the response
     * @returns {Promise<Object>} Generated text and metadata
     */
    'ollama.complete': async (params) => {
        const { prompt, model = 'phi3:mini', stream = false } = params;
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Missing or invalid "prompt"');
        }

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream }),
        });

        if (!response.ok) {
            throw new Error(`Ollama generación falló: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const data = JSON.parse(lastLine);

        if (data.error) {
            throw new Error(data.error);
        }

        return {
            response: data.response.trim(),
            model: data.model,
            total_duration: data.total_duration,
        };
    },

    /**
     * Performs RAG (Retrieval-Augmented Generation) query
     * 
     * @param {Object} params - Query parameters
     * @param {string} params.query - Input query to search for
     * @returns {Promise<Object>} Answer, context, and similarity score
     */
    'rag.query': async (params) => {
        console.log('🔍 knowledgeBase en rag.query:', knowledgeBase.length);
        console.log('🔍 Contenido de knowledgeBase:', knowledgeBase);// ← AGREGA ESTO
        const { query } = params;
        if (!query || typeof query !== 'string') {
            throw new Error('query must be a non-empty string');
        }

        
        const qResp = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'nomic-embed-text:v1.5', prompt: query }),
        });

        if (!qResp.ok) {
            throw new Error(`Error al generar embedding de consulta (${qResp.status})`);
        }

        const qData = await qResp.json();
        if (!qData.embedding || !Array.isArray(qData.embedding)) {
            throw new Error('No se pudo generar embedding para la consulta');
        }
        const queryEmb = qData.embedding;

        // Buscar el fragmento más similar
        let bestScore = -1;
        let bestText = '';
        for (const { text, embedding } of knowledgeBase) {
            const score = cosineSimilarity(queryEmb, embedding);
            if (score > bestScore) {
                bestScore = score;
                bestText = text;
            }
        }

        const context = bestScore > 0.2 ? bestText : 'No se encontró contexto relevante.';
        const prompt = `Contexto: ${context}\n\nPregunta: ${query}\n\nRespuesta:`; // en español

    
        const genResp = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'phi3:mini', prompt, stream: false }),
        });

        if (!genResp.ok) {
            throw new Error(`Error en generación de respuesta (${genResp.status})`);
        }

        const text = await genResp.text();
        const lastLine = text.trim().split('\n').pop();
        const { response } = JSON.parse(lastLine);

        return {
            answer: response.trim(),
            context: bestText,
            similarity: parseFloat(bestScore.toFixed(3)),
        };
    },
});

export { initKnowledgeBase, createMethods };