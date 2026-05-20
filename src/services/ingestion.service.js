// services/ingestion.service.js
const pdfParse = require('pdf-parse');
const { chunkText } = require('../utils/chunkText');
const { generarEmbedding } = require('../utils/embeddings');
const { getConocimientoModel, getChunkModel } = require('../models/conocimiento.model');

async function extractText(fileBuffer, mimetype) {
    if (mimetype === 'application/pdf') {
        const data = await pdfParse(fileBuffer);
        return data.text;
    } else if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
        return fileBuffer.toString('utf-8');
    } else {
        throw new Error(`Formato no soportado: ${mimetype}`);
    }
}

/**
 * Procesa un documento: extrae texto, lo divide en chunks, genera embeddings y guarda en la BD del tenant.
 * @param {mongoose.Connection} connection
 * @param {object} fileInfo - { buffer, mimetype, originalname }
 * @param {object} metadata - { titulo, categoria }
 */
async function ingestDocument(connection, fileInfo, metadata = {}) {
    const Conocimiento = getConocimientoModel(connection);
    const Chunk = getChunkModel(connection);

    const fullText = await extractText(fileInfo.buffer, fileInfo.mimetype);

    // Crear documento principal (metadatos)
    const nuevoDoc = await Conocimiento.create({
        titulo: metadata.titulo || fileInfo.originalname,
        categoria: metadata.categoria || 'otro',
        metadata: {
            filename: fileInfo.originalname,
            size: fileInfo.buffer.length
        }
    });

    // Chunkear y guardar cada fragmento con su embedding
    const chunks = chunkText(fullText, 200, 20);
    for (let i = 0; i < chunks.length; i++) {
        const embedding = await generarEmbedding(chunks[i]);
        await Chunk.create({
            documento_id: nuevoDoc._id,
            contenido: chunks[i],
            embedding,
            orden: i
        });
    }

    console.log(`📥 Documento "${nuevoDoc.titulo}" ingerido con ${chunks.length} chunks.`);
    return { doc: nuevoDoc, totalChunks: chunks.length };
}

module.exports = { ingestDocument };