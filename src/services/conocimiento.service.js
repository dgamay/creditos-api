// services/conocimiento.service.js
const { getChunkModel, getConocimientoModel } = require('../models/conocimiento.model');
const { generarEmbedding } = require('../utils/embeddings');

async function buscarConocimiento(connection, texto, opciones = {}) {
    const Chunk = getChunkModel(connection);
    const Conocimiento = getConocimientoModel(connection);

    const queryVector = await generarEmbedding(texto);

    // Paso 1: Buscar chunks relevantes
    const pipeline = [
        {
            $vectorSearch: {
                index: 'idx_chunks_vector',
                path: 'embedding',
                queryVector: queryVector,
                numCandidates: 100,
                limit: opciones.limit || 5
            }
        },
        { $project: { documento_id: 1, contenido: 1, score: { $meta: 'vectorSearchScore' } } },
        // Agrupar por documento_id y obtener el mejor score
        { $group: {
            _id: '$documento_id',
            bestScore: { $max: '$score' },
            chunks: { $push: { contenido: '$contenido', score: '$score' } }
        }},
        { $sort: { bestScore: -1 } },
        { $limit: opciones.limit || 5 }
    ];

    let resultadosChunks = await Chunk.aggregate(pipeline);

    // Paso 2: Obtener los documentos principales, filtrando por visibilidad según el rol
    const documentosIds = resultadosChunks.map(r => r._id);
    let filtroDoc = { _id: { $in: documentosIds } };

    // Filtro de visibilidad
    if (opciones.role === 'admin') {
        // admin ve todo (no añadimos filtro extra)
    } else if (opciones.role === 'cobrador') {
        filtroDoc.visibilidad = { $in: ['todos', 'cobrador'] };
    } else {
        // usuario no vinculado: solo ve 'todos'
        filtroDoc.visibilidad = 'todos';
    }

    const documentos = await Conocimiento.find(filtroDoc);

    // Mapear resultados finales manteniendo el orden de relevancia
    const finalResults = resultadosChunks
        .filter(r => documentos.some(d => d._id.equals(r._id)))
        .map(r => {
            const doc = documentos.find(d => d._id.equals(r._id));
            return {
                ...doc.toObject(),
                score: r.bestScore,
                chunks_relevantes: r.chunks.sort((a, b) => b.score - a.score).slice(0, 3)
            };
        });

    return finalResults;
}

module.exports = { buscarConocimiento };