const getCreditoModel = require('../models/credito.model');

exports.create = async (req, res) => {
    try {
        const Credito = getCreditoModel(req.db);
        const { monto_prestado, fecha_origen, cliente_id } = req.body;

        // ✅ Validar monto mínimo
        if (!monto_prestado || monto_prestado < 100000) {
            return res.status(400).json({ 
                error: 'El monto mínimo es $100,000' 
            });
        }

        // ✅ Verificar si el cliente ya tiene créditos activos (pendientes)
        const creditoActivo = await Credito.findOne({
            cliente_id: cliente_id,
            estado: 'pendiente'
        });

        if (creditoActivo) {
            return res.status(400).json({ 
                error: 'El cliente ya tiene un crédito activo. Debe saldar el crédito actual antes de solicitar uno nuevo.',
                credito_activo: creditoActivo._id
            });
        }

        // ✅ Calcular comisiones automáticamente
        const comision_total = monto_prestado * 0.30;
        const comision_cobrador = monto_prestado * 0.20;
        const monto_por_pagar = monto_prestado + comision_total;

        // ✅ Calcular y validar fecha de pago
        const fechaOrigen = fecha_origen ? new Date(fecha_origen) : new Date();
        const fechaPagoMaxima = new Date(fechaOrigen);
        fechaPagoMaxima.setDate(fechaPagoMaxima.getDate() + 15);

        // Si el cliente envía fecha_pago, validarla
        if (req.body.fecha_pago) {
            const fechaPagoSolicitada = new Date(req.body.fecha_pago);
            if (fechaPagoSolicitada > fechaPagoMaxima) {
                return res.status(400).json({ 
                    error: `El plazo máximo es 15 días. Fecha límite: ${fechaPagoMaxima.toISOString().split('T')[0]}`
                });
            }
        }

        // ✅ Construir el crédito con valores calculados
        // El frontend NO puede sobreescribir comisiones ni monto_por_pagar
        const creditoData = {
            ...req.body,
            fecha_origen: fechaOrigen,
            fecha_pago: req.body.fecha_pago || fechaPagoMaxima,
            monto_por_pagar,          // sobreescribe lo que venga del frontend
            comision_cobrador,        // sobreescribe lo que venga del frontend
        };

        const credito = new Credito(creditoData);
        await credito.save();
        res.status(201).json(credito);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByCliente = async (req, res) => {
    try {
        const Credito = getCreditoModel(req.db);
        const data = await Credito.find({ cliente_id: req.query.cliente_id });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPendientesByCobrador = async (req, res) => {
    try {
        const Credito = getCreditoModel(req.db);
        const data = await Credito.find({
            cobrador_id: req.query.cobrador_id,
            estado: 'pendiente'
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};