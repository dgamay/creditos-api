// ============================================
// MIDDLEWARE PARA MANEJO DE TENANTS
// ============================================

/**
 * Este middleware extrae el identificador del tenant del header 'X-Tenant-ID'
 * y lo guarda en `req.tenant` para que esté disponible en todos los controladores.
 */

const tenantMiddleware = (req, res, next) => {
    // Obtener el tenant del header 'X-Tenant-ID'
    const tenantId = req.headers['x-tenant-id'];
    
    // Si no viene el header, responder con error
    if (!tenantId) {
        return res.status(400).json({ 
            error: 'Se requiere el header X-Tenant-ID para identificar la empresa' 
        });
    }

    // Validar formato básico (solo letras, números y guiones)
    const tenantRegex = /^[a-zA-Z0-9\-]+$/;
    if (!tenantRegex.test(tenantId)) {
        return res.status(400).json({ 
            error: 'El formato del tenant no es válido. Use solo letras, números y guiones' 
        });
    }

    // Guardar el tenant en el objeto req para usarlo después
    req.tenant = tenantId;
    
    console.log(`🏢 Tenant identificado: ${tenantId}`);
    
    // Continuar con la siguiente función middleware/controlador
    next();
};

module.exports = tenantMiddleware;