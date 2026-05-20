// models/conocimiento.model.js
const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
    titulo:       { type: String, required: true, trim: true },
    contenido:    { type: String, required: true },
    categoria:    { type: String, enum: ['política', 'faq', 'manual', 'otro'], default: 'otro' },
    embedding:    { type: [Number], default: null },  // Vector de 384 dimensiones
    metadata:     { type: mongoose.Schema.Types.Mixed }  // Datos adicionales (ej. autor, área)
}, { timestamps: true, versionKey: false });

// El modelo se obtiene por conexión (multi-tenant)
const getConocimientoModel = (connection) => {
    if (connection.models.Conocimiento) return connection.models.Conocimiento;
    return connection.model('Conocimiento', documentoSchema);
};

module.exports = getConocimientoModel;