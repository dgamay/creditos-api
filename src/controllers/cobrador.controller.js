const Cobrador = require('../models/cobrador.model');

// Crear cobrador
exports.create = async (req, res) => {
    try {
        const nuevo = new Cobrador(req.body);
        await nuevo.save();

        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json(error);
    }
};

// Listar cobradores
exports.getAll = async (req, res) => {
    const data = await Cobrador.find();
    res.json(data);
};
