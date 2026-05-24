// utils/embeddings.js
let embedderPromise = null;

/**
 * Obtiene el pipeline de embeddings (carga perezosa, solo una vez por instancia).
 * La primera llamada descargará el modelo (~80 MB) y lo cachea en memoria.
 */
async function getEmbedder() {
    if (!embedderPromise) {
        // ✅ Importación dinámica: compatible con CommonJS y Vercel
        embedderPromise = import('@xenova/transformers').then(async ({ pipeline }) => {
            console.log('⏳ Cargando modelo de embeddings...');
            const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log('✅ Modelo cargado.');
            return embedder;
        });
    }
    return embedderPromise;
}

/**
 * Genera un vector (embedding) a partir de un texto.
 * @param {string} texto
 * @returns {Promise<number[]>} Vector de 384 números
 */
async function generarEmbedding(texto) {
    const extractor = await getEmbedder();
    const output = await extractor(texto, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

module.exports = { generarEmbedding };