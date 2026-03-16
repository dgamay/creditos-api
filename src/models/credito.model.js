/* const mongoose = require('mongoose');

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
 */

// ============================================
// MODELO DE CRÉDITO (Dinámico por conexión)
// ============================================

const mongoose = require('mongoose');

const creditoSchema = new mongoose.Schema({
    cliente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: [true, 'El cliente es obligatorio']
    },
    cobrador_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cobrador',
        required: [true, 'El cobrador es obligatorio']
    },
    monto_prestado: {
        type: Number,
        required: [true, 'El monto prestado es obligatorio'],
        min: [100000, 'El monto mínimo es $100,000']
    },
    monto_por_pagar: {
        type: Number,
        required: [true, 'El monto a pagar es obligatorio']
    },
    fecha_origen: {
        type: Date,
        required: [true, 'La fecha de origen es obligatoria'],
        default: Date.now
    },
    fecha_pago: {
        type: Date,
        required: [true, 'La fecha de pago es obligatoria']
    },
    fecha_pago_real: {
        type: Date
    },
    estado: {
        type: String,
        enum: ['pendiente', 'pagado', 'vencido'],
        default: 'pendiente'
    },
    comision_cobrador: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

const getCreditoModel = (connection) => {
    if (connection.models.Credito) {
        return connection.models.Credito;
    }
    return connection.model('Credito', creditoSchema);
};

module.exports = getCreditoModel;