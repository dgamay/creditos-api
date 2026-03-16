// ============================================
// CONTROLADOR DE ADMIN - BACKEND
// src/controllers/admin.controller.js
// Maneja todas las operaciones del superadmin:
// - Verificar acceso
// - CRUD de empresas
// - Estadísticas globales
// ============================================

const getEmpresaModel = require('../models/empresa.model');
const { getAdminConnection, getTenantConnection } = require('../config/database');

// ============================================
// VERIFICAR ACCESO ADMIN
// GET /api/admin/verify
// El adminMiddleware ya validó el secret antes
// de llegar aquí — solo respondemos OK
// ============================================
exports.verify = async (req, res) => {
  res.json({ ok: true, message: 'Acceso admin autorizado' });
};

// ============================================
// OBTENER TODAS LAS EMPRESAS
// GET /api/admin/empresas
// ============================================
exports.getEmpresas = async (req, res) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);

    const empresas = await Empresa.find().sort({ createdAt: -1 });

    console.log(`📋 Empresas encontradas: ${empresas.length}`);
    res.json(empresas);

  } catch (error) {
    console.error('❌ Error al obtener empresas:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CREAR NUEVA EMPRESA
// POST /api/admin/empresas
// Body: { tenantId, nombre, email, notas }
// ============================================
exports.createEmpresa = async (req, res) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);

    const { tenantId, nombre, email, notas } = req.body;

    // Validar campos requeridos
    if (!tenantId || !nombre || !email) {
      return res.status(400).json({
        error: 'Los campos tenantId, nombre y email son obligatorios'
      });
    }

    // Verificar que el tenantId no exista ya
    const existente = await Empresa.findOne({ tenantId: tenantId.toLowerCase() });
    if (existente) {
      return res.status(400).json({
        error: `Ya existe una empresa con el tenantId "${tenantId}"`
      });
    }

    // Crear la empresa
    const nuevaEmpresa = new Empresa({
      tenantId: tenantId.toLowerCase().trim(),
      nombre,
      email,
      notas: notas || '',
      activa: true
    });

    await nuevaEmpresa.save();

    console.log(`✅ Empresa creada: ${tenantId}`);
    res.status(201).json(nuevaEmpresa);

  } catch (error) {
    console.error('❌ Error al crear empresa:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ACTIVAR O DESACTIVAR EMPRESA
// PUT /api/admin/empresas/:id/toggle
// Body: { activa: true | false }
// ============================================
exports.toggleEmpresa = async (req, res) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);

    const { id } = req.params;
    const { activa } = req.body;

    // Validar que se envió el campo activa
    if (activa === undefined) {
      return res.status(400).json({
        error: 'Se requiere el campo activa (true o false)'
      });
    }

    const empresa = await Empresa.findByIdAndUpdate(
      id,
      { activa },
      { new: true, runValidators: true }
    );

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    const estado = activa ? 'activada' : 'desactivada';
    console.log(`🔄 Empresa ${empresa.tenantId} ${estado}`);
    res.json({
      message: `Empresa ${estado} exitosamente`,
      empresa
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ELIMINAR EMPRESA
// DELETE /api/admin/empresas/:id
// ============================================
exports.deleteEmpresa = async (req, res) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);

    const { id } = req.params;

    const empresa = await Empresa.findByIdAndDelete(id);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    console.log(`🗑️ Empresa eliminada: ${empresa.tenantId}`);
    res.json({
      message: 'Empresa eliminada exitosamente',
      empresa
    });

  } catch (error) {
    console.error('❌ Error al eliminar empresa:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ESTADÍSTICAS GLOBALES
// GET /api/admin/stats
// Recorre todas las empresas y suma sus datos
// ============================================
exports.getStats = async (req, res) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);

    // Obtener todas las empresas
    const empresas = await Empresa.find();
    const totalEmpresas = empresas.length;
    const empresasActivas = empresas.filter(e => e.activa).length;
    const empresasInactivas = totalEmpresas - empresasActivas;

    // Recorrer cada empresa y contar sus registros
    const statsEmpresas = await Promise.all(
      empresas.map(async (empresa) => {
        try {
          // Conectar a la BD del tenant
          const tenantConn = await getTenantConnection(empresa.tenantId);

          // Contar registros en cada colección
          const totalClientes = await tenantConn.collection('clientes')
            .countDocuments();
          const totalCobradores = await tenantConn.collection('cobradores')
            .countDocuments();
          const totalCreditos = await tenantConn.collection('creditos')
            .countDocuments();
          const creditosPendientes = await tenantConn.collection('creditos')
            .countDocuments({ estado: 'pendiente' });

          return {
            tenantId: empresa.tenantId,
            nombre: empresa.nombre,
            activa: empresa.activa,
            totalClientes,
            totalCobradores,
            totalCreditos,
            creditosPendientes
          };

        } catch (err) {
          // Si la BD del tenant no existe aún, devolver ceros
          return {
            tenantId: empresa.tenantId,
            nombre: empresa.nombre,
            activa: empresa.activa,
            totalClientes: 0,
            totalCobradores: 0,
            totalCreditos: 0,
            creditosPendientes: 0
          };
        }
      })
    );

    res.json({
      resumen: {
        totalEmpresas,
        empresasActivas,
        empresasInactivas
      },
      empresas: statsEmpresas
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};