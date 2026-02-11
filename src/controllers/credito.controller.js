const Credito = require('../models/credito.model');

// Crear crédito
exports.create = async (req, res) => {
    const credito = new Credito(req.body);
    await credito.save();

    res.status(201).json(credito);
};

// Créditos por cliente
exports.getByCliente = async (req, res) => {
    const data = await Credito.find({
        cliente_id: req.query.cliente_id
    });

    res.json(data);
};

// Créditos pendientes por cobrador
exports.getPendientesByCobrador = async (req, res) => {
    const data = await Credito.find({
        cobrador_id: req.query.cobrador_id,
        estado: 'pendiente'
    });

    res.json(data);
};
