// test_vector_search.js
const mongoose = require('mongoose');
const { generarEmbedding } = require('./src/utils/embeddings'); // tu módulo
const getConocimientoModel = require('./src/models/conocimiento.model');
require('dotenv').config();

async function probar() {
    // 1. Conexión a la base del tenant
    const connection = await mongoose.createConnection(process.env.MONGO_URI, {
        dbName: 'empresa1_db' // nombre exacto de la base del tenant
    }).asPromise();
    
    const Conocimiento = getConocimientoModel(connection);

    // 2. Pregunta de prueba
    const pregunta = "¿Qué necesito para que me presten plata otra vez?";
    console.log('🔍 Pregunta:', pregunta);

    // 3. Generar el embedding de la pregunta
    console.log('⚙️ Generando embedding...');
    const queryVector = await generarEmbedding(pregunta);
    console.log(`   Vector de ${queryVector.length} dimensiones generado.`);

    // 4. Consulta vectorial
    const pipeline = [
        {
            $vectorSearch: {
                index: 'idx_conocimiento_vector',
                path: 'embedding',
                queryVector: queryVector,
                numCandidates: 50,
                limit: 3
            }
        },
        {
            $project: {
                titulo: 1,
                contenido: 1,
                categoria: 1,
                score: { $meta: 'vectorSearchScore' }
            }
        }
    ];

    console.log('🚀 Ejecutando búsqueda...');
    const resultados = await Conocimiento.aggregate(pipeline);

    // 5. Mostrar resultados
    console.log('✅ Resultados:');
    if (resultados.length === 0) {
        console.log('(No se encontraron documentos. Asegúrate de haber insertado documentos con embedding real.)');
    } else {
        resultados.forEach((doc, i) => {
            console.log(`\n--- Documento ${i+1} (score: ${doc.score.toFixed(4)}) ---`);
            console.log('Título:', doc.titulo);
            console.log('Contenido:', doc.contenido?.substring(0, 100) + '...');
        });
    }

    await connection.close();
    console.log('🔌 Conexión cerrada.');
}

probar().catch(err => console.error('❌ Error:', err));