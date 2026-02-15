// Importa modelo
const Cobrador = require('../models/cobrador.model');

// Crear cobrador
exports.create = async (req, res) => {
    try {
        // Crea objeto usando datos enviados
        const nuevo = new Cobrador(req.body);

        // Guarda en MongoDB
        await nuevo.save();

        // Responde con objeto creado
        res.status(201).json(nuevo);

    } catch (error) {

        // Si falla, devuelve error
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los cobradores
exports.getAll = async (req, res) => {

    // Busca todos en colección
    const data = await Cobrador.find();

    // Devuelve resultado
    res.json(data);
};
