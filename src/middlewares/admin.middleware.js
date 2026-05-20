// ============================================
// MIDDLEWARE DE ADMINISTRADOR
// Protege todas las rutas /api/admin/*
// Verifica que el header X-Admin-Secret coincida
// con la variable ADMIN_SECRET del .env
// ============================================

const adminMiddleware = (req, res, next) => {

  // Obtener el secret enviado en el header
  const secretEnviado = req.headers['x-admin-secret'];

  // Obtener el secret correcto desde variables de entorno
  const secretCorrecto = process.env.ADMIN_SECRET;

  // Verificar que ADMIN_SECRET esté configurado en .env
  if (!secretCorrecto) {
    console.error('❌ ADMIN_SECRET no está configurado en .env');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  // Verificar que se haya enviado el header
  if (!secretEnviado) {
    console.warn('⚠️ Intento de acceso admin sin credenciales');
    return res.status(401).json({ error: 'Se requiere la clave de administrador' });
  }

  // Comparar los secretos
  if (secretEnviado !== secretCorrecto) {
    console.warn('⚠️ Intento de acceso admin con clave incorrecta');
    return res.status(403).json({ error: 'Clave de administrador inválida' });
  }

  // Si todo coincide, continuar con la siguiente función
  console.log('✅ Acceso admin autorizado');
  next();
};

module.exports = adminMiddleware;