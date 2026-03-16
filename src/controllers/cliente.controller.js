// ============================================
// CONTROLADOR DE CLIENTES - VERSIÓN MULTITENANT
// ============================================

// Importamos la función que obtiene el modelo según la conexión
const getClienteModel = require('../models/cliente.model');

// ============================================
// CREAR NUEVO CLIENTE
// ============================================
const create = async (req, res) => {
    try {
        // Obtener el modelo de Cliente usando la conexión del tenant actual
        const Cliente = getClienteModel(req.db);
        
        console.log(`📝 [Tenant: ${req.tenant}] Creando nuevo cliente:`, req.body);
        
        // Crear nuevo cliente con los datos recibidos
        const nuevoCliente = new Cliente(req.body);
        
        // Guardar en la base de datos del tenant
        await nuevoCliente.save();
        
        // Responder con el cliente creado
        res.status(201).json(nuevoCliente);
        
    } catch (error) {
        console.error(`❌ [Tenant: ${req.tenant}] Error al crear cliente:`, error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER CLIENTES (con filtro por cobrador)
// ============================================
const getByCobrador = async (req, res) => {
    try {
        const Cliente = getClienteModel(req.db);
        const { cobrador_id } = req.query;
        
        let query = {};
        if (cobrador_id) {
            query.cobrador_id = cobrador_id;
        }
        
        const clientes = await Cliente.find(query);
        res.json(clientes);
        
    } catch (error) {
        console.error(`❌ [Tenant: ${req.tenant}] Error al obtener clientes:`, error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// OBTENER CLIENTE POR ID
// ============================================
const getById = async (req, res) => {
    try {
        const Cliente = getClienteModel(req.db);
        const { id } = req.params;
        
        console.log(`🔍 [Tenant: ${req.tenant}] Buscando cliente:`, id);
        
        const cliente = await Cliente.findById(id);
        
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json(cliente);
        
    } catch (error) {
        console.error(`❌ [Tenant: ${req.tenant}] Error al obtener cliente:`, error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ACTUALIZAR CLIENTE
// ============================================
const update = async (req, res) => {
    try {
        const Cliente = getClienteModel(req.db);
        const { id } = req.params;
        
        console.log(`📝 [Tenant: ${req.tenant}] Actualizando cliente:`, id, req.body);
        
        const clienteActualizado = await Cliente.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!clienteActualizado) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json(clienteActualizado);
        
    } catch (error) {
        console.error(`❌ [Tenant: ${req.tenant}] Error al actualizar cliente:`, error);
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// ELIMINAR CLIENTE
// ============================================
const deleteCliente = async (req, res) => {
    try {
        const Cliente = getClienteModel(req.db);
        const { id } = req.params;
        
        console.log(`🗑️ [Tenant: ${req.tenant}] Eliminando cliente:`, id);
        
        const clienteEliminado = await Cliente.findByIdAndDelete(id);
        
        if (!clienteEliminado) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json({ 
            message: 'Cliente eliminado correctamente',
            cliente: clienteEliminado 
        });
        
    } catch (error) {
        console.error(`❌ [Tenant: ${req.tenant}] Error al eliminar cliente:`, error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    create,
    getByCobrador,
    getById,
    update,
    delete: deleteCliente
};