const { buscarConocimiento } = require('../services/conocimiento.service');

// GET /api/conocimiento/search?q=texto&categoria=faq&limit=3


const searchConocimiento = async (req, res) => {
console.log('Tenant:', req.tenant, 'BD real:', req.db?.name || 'sin nombre aún');
    try {
        const { q, categoria, limit } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El parámetro "q" (texto de búsqueda) es obligatorio.'
            });
        }

        // Obtener la conexión del tenant (debe venir del middleware)
        // ✅ Correcto (como en cliente.controller.js)
        const tenantConnection = req.db;
        if (!tenantConnection) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo determinar la base de datos del tenant.'
            });
        }
        const resultados = await buscarConocimiento(tenantConnection, q.trim(), { 
            limit: parseInt(limit) || 5,
            categoria: categoria || null
        });

        return res.json({
            success: true,
            data: resultados,
            query: q
        });
    } catch (error) {
        console.error('Error en búsqueda de conocimiento:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al realizar la búsqueda.'
        });
    }
};

module.exports = { searchConocimiento };