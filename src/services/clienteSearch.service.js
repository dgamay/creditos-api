// services/clienteSearch.service.js

/**
 * Busca clientes similares usando búsqueda vectorial
 * @param {mongoose.Connection} connection - Conexión del tenant
 * @param {string} descripcionBusqueda - Texto de búsqueda en lenguaje natural
 * @param {Object} opciones - Filtros adicionales
 * @returns {Array} - Clientes similares ordenados por relevancia
 */
async function buscarClientesSimilares(connection, descripcionBusqueda, opciones = {}) {
    const Cliente = require('../models/cliente.model')(connection);
    const { generarEmbeddingCliente } = require('../utils/generarEmbeddings');
    
    // 1. Generar embedding de la consulta
    const queryEmbedding = await generarEmbeddingCliente({
        nombre: descripcionBusqueda, // Usamos la descripción como "nombre" temporal
        direccion: '',
        celular: '',
        cobrador_id: null
    });
    
    // 2. Pipeline de agregación con búsqueda vectorial
    const pipeline = [
        {
            $vectorSearch: {
                index: "indice_busqueda_clientes",
                path: "descripcion_vectorial",
                queryVector: queryEmbedding,
                numCandidates: 100,
                limit: opciones.limit || 10,
                ...(opciones.filtroCobrador && {
                    filter: {
                        cobrador_id: opciones.filtroCobrador
                    }
                })
            }
        },
        {
            $project: {
                nombre: 1,
                direccion: 1,
                celular: 1,
                score: { $meta: "vectorSearchScore" }
            }
        }
    ];
    
    const resultados = await Cliente.aggregate(pipeline);
    return resultados;
}