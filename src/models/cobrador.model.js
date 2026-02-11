const mongoose = require('mongoose');

const CobradorSchema = new mongoose.Schema({
    nombre: String,
    celular: String,
    direccion: String,
    cedula: String
});

module.exports = mongoose.model('Cobrador', CobradorSchema);
