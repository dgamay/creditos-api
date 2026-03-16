// ============================================
// MIDDLEWARE PARA INYECTAR LA CONEXIÓN A LA BD DEL TENANT
// ============================================

const { getTenantConnection } = require('../config/database');

/**
 * Middleware que obtiene la conexión a la BD del tenant y la guarda en `req.db`
 * para que los controladores puedan usarla sin preocuparse de qué tenant es.
 */
const databaseMiddleware = async (req, res, next) => {
    try {
        // req.tenant viene del tenantMiddleware (ejecutado antes)
        if (!req.tenant) {
            return res.status(500).json({ 
                error: 'Error interno: No se encontró el tenant en la petición' 
            });
        }

        // Obtener conexión para este tenant (reutiliza si ya existe)
        const connection = await getTenantConnection(req.tenant);
        
        // Guardar la conexión en req para que los controladores la usen
        req.db = connection;
        
        next(); // Continuar con el controlador
        
    } catch (error) {
        console.error('❌ Error en middleware de base de datos:', error);
        res.status(500).json({ 
            error: 'Error al conectar con la base de datos del tenant' 
        });
    }
};

module.exports = databaseMiddleware;