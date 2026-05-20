// scripts/crearIndicesVectoriales.js
// Se ejecuta UNA VEZ por cada tenant

async function crearIndiceVectorial(connection) {
    const db = connection.db;
    
    await db.collection('clientes').createSearchIndex({
        name: "indice_busqueda_clientes",
        type: "vectorSearch",
        definition: {
            fields: [{
                type: "vector",
                numDimensions: 1024,
                path: "descripcion_vectorial",
                similarity: "cosine"
            }]
        }
    });
    
    console.log('Índice vectorial creado en la BD del tenant');
}