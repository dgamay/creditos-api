// utils/crearIndiceVectorial.js
async function crearIndiceConocimiento(connection) {
    const db = connection.db;
    const coleccion = db.collection('conocimientos'); // nombre real de la colección

    await coleccion.createSearchIndex({
        name: 'idx_conocimiento_vector',
        type: 'vectorSearch',
        definition: {
            fields: [{
                type: 'vector',
                numDimensions: 384,              // Debe coincidir con 'all-MiniLM-L6-v2'
                path: 'embedding',
                similarity: 'cosine'             // Funciona bien para textos semánticos
            }]
        }
    });
}