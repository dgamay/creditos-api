const Cliente = require('../models/cliente.model');

// Crear cliente
exports.create = async (req, res) => {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
};

// Clientes por cobrador
exports.getByCobrador = async (req, res) => {
    const clientes = await Cliente.find({
        cobrador_id: req.query.cobrador_id
    });

    res.json(clientes);
};
