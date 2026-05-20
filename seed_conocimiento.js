// seed_conocimiento.js
const mongoose = require('mongoose');
const { generarEmbedding } = require('./src/utils/embeddings');
const getConocimientoModel = require('./src/models/conocimiento.model');
require('dotenv').config();

async function seed() {
    const connection = await mongoose.createConnection(process.env.MONGO_URI, {
        dbName: 'empresa1_db'
    }).asPromise();
    
    const Conocimiento = getConocimientoModel(connection);
    
    const documentos = [
        {
            titulo: "Política de otorgamiento de créditos",
            contenido: "Se otorgan créditos de hasta $500,000 a clientes con historial limpio. Para montos mayores se requiere un fiador.",
            categoria: "política"
        },
        {
            titulo: "Cómo se calcula la comisión del cobrador",
            contenido: "La comisión es el 5% del monto pagado a tiempo. Si el pago se atrasa más de 15 días, la comisión se reduce al 3%.",
            categoria: "faq"
        },
        {
            titulo: "Requisitos para renovación de crédito",
            contenido: "El cliente debe haber pagado al menos el 80% del crédito anterior y no tener cuotas vencidas.",
            categoria: "política"
        }
    ];
    
    for (let doc of documentos) {
        console.log(`Generando embedding para: ${doc.titulo}`);
        doc.embedding = await generarEmbedding(doc.contenido);
        await Conocimiento.create(doc);
        console.log(`Insertado: ${doc.titulo}`);
    }
    
    console.log('✅ Base de conocimiento poblada con 3 documentos.');
    await connection.close();
}

seed().catch(err => console.error('❌ Error:', err));