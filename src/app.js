const express = require('express');
const cors = require('cors');
const tenantMiddleware = require('./middlewares/tenant.middleware');
const databaseMiddleware = require('./middlewares/database.middleware');

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://creditos-frontend-djb3ao61q-dgamays-projects.vercel.app',
    /https:\/\/creditos-frontend.*\.vercel\.app$/,
  ],
  methods: ['GET', 'POST','PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Admin-Secret'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('/{*path}', cors(corsOptions));
app.use(express.json());

// ✅ Rutas admin — van ANTES del tenantMiddleware
// No necesitan X-Tenant-ID, tienen su propio middleware
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/webhook', require('./routes/webhook.routes'));

// Rutas normales — requieren X-Tenant-ID
app.use('/api', tenantMiddleware);
app.use('/api', databaseMiddleware);

app.get('/', (req, res) => {
  res.send('API de créditos funcionando (Modo Multitenant)');
});


app.use('/api/auth', require('./routes/auth.routes')); 
app.use('/api/cobradores', require('./routes/cobrador.routes'));
app.use('/api/clientes', require('./routes/cliente.routes'));
app.use('/api/creditos', require('./routes/credito.routes'));
// Webhook de Telegram — sin middlewares de tenant ni admin

app.use((err, req, res, next) => {
  console.error('🔥 Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;