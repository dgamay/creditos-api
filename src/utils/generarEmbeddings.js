// utils/generarEmbeddings.js
const voyage = require('voyageai'); // o el SDK que uses

/**
 * Genera un embedding para un cliente basado en su perfil
 * @param {Object} cliente - Documento del cliente
 * @returns {Array} - Vector de 1024 dimensiones
 */
async function generarEmbeddingCliente(cliente) {
    const textoPerfil = `
        Cliente: ${cliente.nombre}
        Dirección: ${cliente.direccion || 'No especificada'}
        Celular: ${cliente.celular}
        Cobrador asignado: ${cliente.cobrador_id ? 'Sí' : 'No'}
    `.trim();
    
    const response = await voyage.embed({
        input: textoPerfil,
        model: 'voyage-3-large'  // 1024 dimensiones
    });
    
    return response.data[0].embedding;
}

module.exports = { generarEmbeddingCliente };