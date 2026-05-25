// models/conocimiento.model.js
const mongoose = require('mongoose');

// ── Esquema del documento principal (metadatos) ──
const documentoSchema = new mongoose.Schema({
    titulo:    { type: String, required: true, trim: true },
    categoria: { type: String, enum: ['política', 'faq', 'manual', 'otro'], default: 'otro' },
    visibilidad: { type: String, enum: ['todos', 'cobrador', 'admin'], default: 'todos' },
    metadata:  { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, versionKey: false });

// ── Esquema de los chunks (fragmentos con embedding) ──
const chunkSchema = new mongoose.Schema({
    documento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conocimiento', required: true },
    contenido:    { type: String, required: true },
    embedding:    { type: [Number], required: true },
    orden:        { type: Number, required: true }
}, { timestamps: true, versionKey: false });

// ── Funciones que devuelven el modelo según la conexión activa ──
const getConocimientoModel = (connection) => {
    if (connection.models.Conocimiento) return connection.models.Conocimiento;
    return connection.model('Conocimiento', documentoSchema);
};

const getChunkModel = (connection) => {
    if (connection.models.ConocimientoChunk) return connection.models.ConocimientoChunk;
    return connection.model('ConocimientoChunk', chunkSchema);
};

module.exports = { getConocimientoModel, getChunkModel };