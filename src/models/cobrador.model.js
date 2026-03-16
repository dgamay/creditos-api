// ============================================
// MODELO DE COBRADOR (Dinámico por conexión)
// ============================================

const mongoose = require('mongoose');

const cobradorSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    cedula: {
        type: String,
        required: [true, 'La cédula es obligatoria'],
        unique: true,
        trim: true
    },
    direccion: {
        type: String,
        trim: true
    },
    celular: {
        type: String,
        required: [true, 'El celular es obligatorio'],
        trim: true
    }
}, {
    timestamps: true,
    versionKey: false
});

const getCobradorModel = (connection) => {
    if (connection.models.Cobrador) {
        return connection.models.Cobrador;
    }
    return connection.model('Cobrador', cobradorSchema);
};

module.exports = getCobradorModel;