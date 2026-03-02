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

/*Actualizar cliente
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteActualizado = await Cliente.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true } // Para que devuelva el documento actualizado
    );
    
    if (!clienteActualizado) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ELIMINAR CLIENTE
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteEliminado = await Cliente.findByIdAndDelete(id);
    
    if (!clienteEliminado) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};/*
