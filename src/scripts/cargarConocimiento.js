// scripts/cargarConocimiento.js
const mongoose = require('mongoose');
const { generarEmbedding } = require('../utils/embeddings');
const getConocimientoModel = require('../models/conocimiento.model');

async function cargarDocumentos(connection) {
    const Conocimiento = getConocimientoModel(connection);

    const documentos = [
        { titulo: 'Política de otorgamiento', contenido: 'Créditos hasta 500,000 a clientes con historial limpio...', categoria: 'política' },
        { titulo: '¿Cómo se calcula la comisión?', contenido: 'La comisión del cobrador es el 5% del monto pagado...', categoria: 'faq' },
        // ... más documentos
    ];

    for (let doc of documentos) {
        doc.embedding = await generarEmbedding(doc.contenido);
        await Conocimiento.create(doc);
    }

    console.log('Documentos cargados con embeddings.');
}