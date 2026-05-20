// services/busqueda.service.js
const { generarEmbedding } = require('../utils/embeddings');
const getConocimientoModel = require('../models/conocimiento.model');

async function buscarConocimiento(connection, pregunta, limite = 3) {
    const Conocimiento = getConocimientoModel(connection);

    // 1. Generar el vector de la pregunta
    const queryVector = await generarEmbedding(pregunta);

    // 2. Pipeline de agregación con búsqueda vectorial
    const pipeline = [
        {
            $vectorSearch: {
                index: 'idx_conocimiento_vector',
                path: 'embedding',
                queryVector: queryVector,
                numCandidates: 50,
                limit: limite
            }
        },
        {
            $project: {
                titulo: 1,
                contenido: 1,
                categoria: 1,
                score: { $meta: 'vectorSearchScore' }  // Similitud cosine
            }
        }
    ];

    const resultados = await Conocimiento.aggregate(pipeline);
    return resultados;
}