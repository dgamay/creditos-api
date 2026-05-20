// utils/embeddings.js
const { pipeline } = require('@xenova/transformers');

let embedder = null;

async function getEmbedder() {
    if (!embedder) {
        // Carga el modelo la primera vez (descarga ~80 MB)
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

/**
 * Convierte un texto en un vector numérico (embedding).
 * @param {string} texto
 * @returns {Promise<number[]>} Vector de 384 números
 */
async function generarEmbedding(texto) {
    const extractor = await getEmbedder();
    const output = await extractor(texto, { pooling: 'mean', normalize: true });
    return Array.from(output.data); // Devuelve array de float32
}

module.exports = { generarEmbedding };