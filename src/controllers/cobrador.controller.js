const getCobradorModel = require('../models/cobrador.model');

exports.create = async (req, res) => {
    try {
        const Cobrador = getCobradorModel(req.db);
        const nuevo = new Cobrador(req.body);
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const Cobrador = getCobradorModel(req.db);
        const data = await Cobrador.find();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const Cobrador = getCobradorModel(req.db);
        const actualizado = await Cobrador.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!actualizado) return res.status(404).json({ error: 'Cobrador no encontrado' });
        res.json(actualizado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const Cobrador = getCobradorModel(req.db);
        const eliminado = await Cobrador.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ error: 'Cobrador no encontrado' });
        res.json({ message: 'Cobrador eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};