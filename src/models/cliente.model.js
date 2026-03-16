// ============================================
// MODELO DE CLIENTE (Ahora recibe la conexión dinámicamente)
// ============================================

const mongoose = require('mongoose');

// Definir el esquema del cliente (SIN campo tenantId porque usamos BD separadas)
const clienteSchema = new mongoose.Schema({
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
        required: false,
        trim: true
    },
    celular: {
        type: String,
        required: [true, 'El celular es obligatorio'],
        trim: true
    },
    cobrador_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cobrador',
        required: false
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false // Quita el campo __v de MongoDB
});

/**
 * Función para obtener el modelo de Cliente para un tenant específico
 * @param {mongoose.Connection} connection - Conexión activa del tenant
 * @returns {mongoose.Model} - Modelo de Cliente para ese tenant
 */
const getClienteModel = (connection) => {
    // Si ya existe el modelo en esta conexión, devolverlo
    if (connection.models.Cliente) {
        return connection.models.Cliente;
    }
    
    // Si no existe, crearlo
    return connection.model('Cliente', clienteSchema);
};

module.exports = getClienteModel;