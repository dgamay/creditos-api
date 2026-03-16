// ============================================
// CONFIGURACIÓN DE CONEXIONES A MONGODB (MULTITENANT)
// ============================================

const mongoose = require('mongoose');

// Almacenar conexiones activas por tenant
// Esto evita crear una nueva conexión en cada petición
const connections = {};

const conectarDB = async () => {
    console.log('🔄 Sistema multitenant listo - Las conexiones se crearán bajo demanda');
    return true;
};

/**
 * Obtiene (o crea) la conexión a la base de datos de un tenant específico
 * @param {string} tenantId - Identificador del tenant (ej: 'empresa1')
 * @returns {Promise<mongoose.Connection>} - Conexión a la BD del tenant
 */
const getTenantConnection = async (tenantId) => {
    try {
        // Si ya existe una conexión para este tenant, la reutilizamos
        if (connections[tenantId]) {
            console.log(`📡 Reutilizando conexión existente para tenant: ${tenantId}`);
            return connections[tenantId];
        }

        // Construir el nombre de la base de datos para este tenant
        // Formato: [tenantId]_db  (ej: empresa1_db)
        const dbName = `${tenantId}_db`;
        
        // Obtener la URI base desde .env (sin el nombre de la BD)
        const baseUri = process.env.MONGO_URI;
        
        if (!baseUri) {
            throw new Error('MONGO_URI no está definido en las variables de entorno');
        }

        // Crear la URI específica para este tenant
        // Asumimos que MONGO_URI tiene formato: mongodb://usuario:pass@host:puerto/
        // Le agregamos el nombre de la base de datos al final
        const tenantUri = baseUri.endsWith('/') 
            ? `${baseUri}${dbName}` 
            : `${baseUri}/${dbName}`;

        console.log(`🆕 Creando nueva conexión para tenant: ${tenantId} -> BD: ${dbName}`);

        // Crear nueva conexión para este tenant
       const connection = mongoose.createConnection(tenantUri);

        // Guardar la conexión para reutilizarla después
        connections[tenantId] = connection;

        // Evento de conexión exitosa
        connection.on('connected', () => {
            console.log(`✅ MongoDB conectado para tenant: ${tenantId}`);
        });

        // Evento de error
        connection.on('error', (err) => {
            console.error(`❌ Error en conexión de tenant ${tenantId}:`, err);
            delete connections[tenantId]; // Eliminar conexión fallida
        });

        return connection;

    } catch (error) {
        console.error(`❌ Error al obtener conexión para tenant ${tenantId}:`, error);
        throw error;
    }
};

/**
 * Cierra todas las conexiones activas (útil para tests o cierre de aplicación)
 */
const closeAllConnections = async () => {
    const closePromises = Object.keys(connections).map(async (tenantId) => {
        await connections[tenantId].close();
        delete connections[tenantId];
        console.log(`🔒 Conexión cerrada para tenant: ${tenantId}`);
    });
    
    await Promise.all(closePromises);
};
// ============================================
// CONEXIÓN A LA BASE DE DATOS CENTRAL (admin_db)
// BACKEND — src/config/database.js
// BD separada de los tenants — solo para superadmin
// Guarda el registro de todas las empresas
// ============================================

let adminConnection = null;

const getAdminConnection = async () => {
  try {
    // Reutilizar conexión existente si ya está abierta
    if (adminConnection) {
      console.log('📡 Reutilizando conexión admin_db');
      return adminConnection;
    }

    const baseUri = process.env.MONGO_URI;

    if (!baseUri) {
      throw new Error('MONGO_URI no está definido en las variables de entorno');
    }

    // Construir URI apuntando a admin_db
    const url = new URL(baseUri);
    url.pathname = '/admin_db';
    const adminUri = url.toString();

    console.log('🆕 Creando conexión a admin_db...');

    // Crear conexión dedicada para admin
    adminConnection = mongoose.createConnection(adminUri);

    adminConnection.on('connected', () => {
      console.log('✅ MongoDB conectado a admin_db');
    });

    adminConnection.on('error', (err) => {
      console.error('❌ Error en conexión admin_db:', err);
      adminConnection = null;
    });

    return adminConnection;

  } catch (error) {
    console.error('❌ Error al conectar a admin_db:', error);
    throw error;
  }
};

module.exports = {
    getTenantConnection,
    getAdminConnection,
    closeAllConnections,
    conectarDB
};