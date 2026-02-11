const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    nombre: String,
    cedula: String,
    direccion: String,
    celular: String,

    // Relación con cobrador
    cobrador_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cobrador'
    }
});

module.exports = mongoose.model('Cliente', ClienteSchema);
