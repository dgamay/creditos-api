const { getConocimientoModel, getChunkModel } = require('../models/conocimiento.model');
const { generarEmbedding } = require('../utils/embeddings');

/**
 * Busca documentos en la base de conocimiento del tenant.
 * @param {mongoose.Connection} connection - Conexión del tenant
 * @param {string} texto - Texto de búsqueda (lenguaje natural)
 * @param {object} opciones - Opciones adicionales (límite, categoría, etc.)
 * @returns {Promise<Array>} Resultados ordenados por relevancia
 */
async function buscarConocimiento(connection, texto, opciones = {}) {
    const Conocimiento = getConocimientoModel(connection);

    // 1. Generar el vector de la consulta
    const queryVector = await generarEmbedding(texto);

    // 2. Armar el pipeline base
    const pipeline = [
        {
            $vectorSearch: {
                index: 'idx_conocimiento_vector',
                path: 'embedding',
                queryVector: queryVector,
                numCandidates: 100,          // Ajustable según volumen
                limit: opciones.limit || 5   // Resultados a devolver
            }
        },
        {
            $project: {
                titulo: 1,
                contenido: 1,
                categoria: 1,
                score: { $meta: 'vectorSearchScore' }
            }
        }
    ];

    // 3. Si se filtra por categoría, añadir etapa $match posterior
    if (opciones.categoria) {
        pipeline.push({
            $match: { categoria: opciones.categoria }
        });
        // Si filtramos después, puede reducir el número de resultados,
        // por eso conviene pedir más candidatos.
    }

    const resultados = await Conocimiento.aggregate(pipeline);
    return resultados;
}

module.exports = { buscarConocimiento };