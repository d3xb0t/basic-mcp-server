export const methods = {
    /**
     * Method that adds two numbers
     * 
     * Validates that both parameters are numbers to prevent type errors
     * 
     * @param {Object} params - Input parameters
     * @param {number} params.a - First number
     * @param {number} params.b - Second number
     * @returns {number} The sum of a and b
     * @throws {Error} If either parameter is not a number
     */
    'math.add': (params) => {
        if (typeof params.a !== 'number' || typeof params.b !== 'number') {
            throw new Error('Both "a" and "b" must be numbers');
        }
        return params.a + params.b;
    },

    /**
     * Simple ping method that responds with 'pong'
     * 
     * @returns {string} 'pong'
     */
    'ping': () => 'pong',

    /**
     * Method that calls the Ollama API to generate text completions
     * 
     * This method connects to the local Ollama service to generate responses
     * based on the provided prompt using the specified model.
     * 
     * @param {Object} params - Input parameters
     * @param {string} params.prompt - The input text to generate completions for
     * @param {string} [params.model='qwen:latest'] - The model to use for generation (default: 'qwen:latest')
     * @param {boolean} [params.stream=false] - Whether to stream the response (default: false)
     * @returns {Promise<Object>} Object containing the response, model name, and total duration
     * @throws {Error} If the prompt is missing or invalid, or if the Ollama API returns an error
     */
    'ollama.complete': async (params) => {
        const { prompt, model = 'gemma3:1b', stream = false } = params;

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Missing or invalid "prompt" (must be a non-empty string)');
        }

        // Llamamos a la API de Ollama
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream, // en este ejemplo, lo dejamos en false (respuesta completa)
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.trim().split('\n');

        // Ollama devuelve una línea JSON por trozo (aunque stream=false, a veces manda uno solo)
        // Pero cuando stream=false, normalmente es una sola línea
        const lastLine = lines[lines.length - 1];
        const data = JSON.parse(lastLine);

        if (data.error) {
            throw new Error(data.error);
        }

        return {
            response: data.response,
            model: data.model,
            total_duration: data.total_duration,
        };
    },
};