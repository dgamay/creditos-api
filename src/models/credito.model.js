const mongoose = require('mongoose');

const CreditoSchema = new mongoose.Schema({
    fecha_origen: Date,
    fecha_pago: Date,

    monto_prestado: Number,
    monto_por_pagar: Number,

    estado: {
        type: String,
        enum: ['pendiente', 'pagado'],
        default: 'pendiente'
    },

    cliente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente'
    },

    cobrador_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cobrador'
    }
});

module.exports = mongoose.model('Credito', CreditoSchema);
