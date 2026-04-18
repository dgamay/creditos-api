// ============================================
// WEBHOOK CONTROLLER - BACKEND
// src/controllers/webhook.controller.js
// Procesa todos los mensajes entrantes de Telegram
// ============================================

const telegramService = require('../services/telegram.service');
const { getAdminConnection, getTenantConnection } = require('../config/database');
const getCobradorModel = require('../models/cobrador.model');
const getCreditoModel = require('../models/credito.model');
const getClienteModel = require('../models/cliente.model');
const getEmpresaModel = require('../models/empresa.model');

// ============================================
// SESIONES TEMPORALES EN MEMORIA
// Guarda el estado de conversación por chatId
// ============================================
const sesiones = {};

// ============================================
// SOLICITUDES DE EDICIÓN PENDIENTES
// Guarda ediciones esperando aprobación del admin
// Formato: { solicitudId: { chatId, tenantId, ... } }
// ============================================
const solicitudesEdicion = {};

// ============================================
// ESTADOS DE LA CONVERSACIÓN
// ============================================
const PASOS = {
  // Estados generales
  INICIO: 'inicio',
  ESPERANDO_EMPRESA: 'esperando_empresa',
  ESPERANDO_CEDULA: 'esperando_cedula',
  VINCULADO: 'vinculado',

  // Estados admin de empresa
  ESPERANDO_ADMIN_EMPRESA: 'esperando_admin_empresa',
  ESPERANDO_ADMIN_EMAIL: 'esperando_admin_email',
  ADMIN_VINCULADO: 'admin_vinculado',

  // Estados crear cliente
  CREANDO_CLIENTE_NOMBRE: 'creando_cliente_nombre',
  CREANDO_CLIENTE_CEDULA: 'creando_cliente_cedula',
  CREANDO_CLIENTE_CELULAR: 'creando_cliente_celular',
  CREANDO_CLIENTE_DIRECCION: 'creando_cliente_direccion',

  // Estados crear crédito
  CREANDO_CREDITO_CEDULA: 'creando_credito_cedula',
  CREANDO_CREDITO_MONTO: 'creando_credito_monto',
  CREANDO_CREDITO_FECHA: 'creando_credito_fecha',

  // Estados editar cliente
  EDITANDO_CLIENTE_CEDULA: 'editando_cliente_cedula',
  EDITANDO_CLIENTE_CAMPO: 'editando_cliente_campo',
  EDITANDO_CLIENTE_VALOR: 'editando_cliente_valor',
};

// ============================================
// HELPERS — funciones auxiliares
// ============================================

const getSesion = (chatId) => {
  if (!sesiones[chatId]) {
    sesiones[chatId] = { paso: PASOS.INICIO };
  }
  return sesiones[chatId];
};

// Buscar cobrador por cédula en el tenant
const buscarCobrador = async (tenantId, cedula) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Cobrador = getCobradorModel(connection);
    return await Cobrador.findOne({ cedula: cedula.trim() });
  } catch (error) {
    console.error('❌ Error buscando cobrador:', error.message);
    return null;
  }
};

// Verificar empresa activa en admin_db
const verificarEmpresa = async (tenantId) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);
    return await Empresa.findOne({
      tenantId: tenantId.toLowerCase().trim(),
      activa: true
    });
  } catch (error) {
    console.error('❌ Error verificando empresa:', error.message);
    return null;
  }
};

// Vincular cobrador con su chat_id de Telegram
const vincularCobrador = async (tenantId, cedula, chatId) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Cobrador = getCobradorModel(connection);
    await Cobrador.findOneAndUpdate(
      { cedula: cedula.trim() },
      { telegram_chat_id: String(chatId) },
      { new: true }
    );
    console.log(`✅ Cobrador ${cedula} vinculado con chat ${chatId}`);
  } catch (error) {
    console.error('❌ Error vinculando cobrador:', error.message);
    throw error;
  }
};

// Vincular admin de empresa con su chat_id de Telegram
const vincularAdminEmpresa = async (tenantId, chatId) => {
  try {
    const connection = await getAdminConnection();
    const Empresa = getEmpresaModel(connection);
    await Empresa.findOneAndUpdate(
      { tenantId: tenantId.toLowerCase() },
      { admin_telegram_chat_id: String(chatId) },
      { new: true }
    );
    console.log(`✅ Admin de ${tenantId} vinculado con chat ${chatId}`);
  } catch (error) {
    console.error('❌ Error vinculando admin:', error.message);
    throw error;
  }
};

// ============================================
// COMANDOS DEL COBRADOR
// ============================================

// Mostrar créditos pendientes del cobrador
const mostrarPendientes = async (chatId, tenantId, cobradorId) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Credito = getCreditoModel(connection);
    const Cliente = getClienteModel(connection);

    const creditos = await Credito.find({
      cobrador_id: cobradorId,
      estado: 'pendiente'
    });

    if (creditos.length === 0) {
      await telegramService.responder(chatId,
        '✅ <b>No tienes créditos pendientes</b>\n\nTodo al día 🎉'
      );
      return;
    }

    let mensaje = `📋 <b>Tus créditos pendientes (${creditos.length})</b>\n\n`;

    for (const credito of creditos) {
      const cliente = await Cliente.findById(credito.cliente_id);
      const fechaPago = new Date(credito.fecha_pago);
      const hoy = new Date();
      const vencido = fechaPago < hoy;

      mensaje += `${vencido ? '🔴' : '🟡'} <b>${cliente?.nombre || 'Cliente'}</b>\n`;
      mensaje += `   💰 $${credito.monto_por_pagar?.toLocaleString('es-CO')}\n`;
      mensaje += `   📅 ${fechaPago.toLocaleDateString('es-CO')}`;
      mensaje += vencido ? ' ⚠️ VENCIDO\n\n' : '\n\n';
    }

    await telegramService.responder(chatId, mensaje);

  } catch (error) {
    console.error('❌ Error mostrando pendientes:', error.message);
    await telegramService.responder(chatId, '❌ Error al obtener créditos.');
  }
};

// Mostrar mis clientes asignados
const mostrarMisClientes = async (chatId, tenantId, cobradorId) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Cliente = getClienteModel(connection);

    const clientes = await Cliente.find({ cobrador_id: cobradorId });

    if (clientes.length === 0) {
      await telegramService.responder(chatId,
        'ℹ️ <b>No tienes clientes asignados</b>\n\nUsa /nuevo_cliente para crear uno.'
      );
      return;
    }

    let mensaje = `👥 <b>Tus clientes (${clientes.length})</b>\n\n`;
    clientes.forEach((c, i) => {
      mensaje += `${i + 1}. <b>${c.nombre}</b>\n`;
      mensaje += `   🆔 ${c.cedula} | 📞 ${c.celular}\n\n`;
    });

    await telegramService.responder(chatId, mensaje);

  } catch (error) {
    console.error('❌ Error mostrando clientes:', error.message);
    await telegramService.responder(chatId, '❌ Error al obtener clientes.');
  }
};

// Procesar pago de un crédito
const procesarPago = async (chatId, tenantId, cedulaCliente) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Credito = getCreditoModel(connection);
    const Cliente = getClienteModel(connection);

    const cliente = await Cliente.findOne({ cedula: cedulaCliente.trim() });
    if (!cliente) {
      await telegramService.responder(chatId,
        `❌ No encontré ningún cliente con cédula <b>${cedulaCliente}</b>`
      );
      return;
    }

    const credito = await Credito.findOne({
      cliente_id: cliente._id,
      estado: 'pendiente'
    });

    if (!credito) {
      await telegramService.responder(chatId,
        `ℹ️ <b>${cliente.nombre}</b> no tiene créditos pendientes.`
      );
      return;
    }

    await Credito.findByIdAndUpdate(credito._id, {
      estado: 'pagado',
      fecha_pago_real: new Date()
    });

    await telegramService.responder(chatId,
      `✅ <b>Pago registrado</b>\n\n` +
      `👤 Cliente: ${cliente.nombre}\n` +
      `💰 Monto: $${credito.monto_por_pagar?.toLocaleString('es-CO')}\n` +
      `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}`
    );

  } catch (error) {
    console.error('❌ Error procesando pago:', error.message);
    await telegramService.responder(chatId, '❌ Error al registrar el pago.');
  }
};

// Ver datos de un cliente
const mostrarCliente = async (chatId, tenantId, cedulaCliente) => {
  try {
    const connection = await getTenantConnection(tenantId);
    const Cliente = getClienteModel(connection);
    const Credito = getCreditoModel(connection);

    const cliente = await Cliente.findOne({ cedula: cedulaCliente.trim() });
    if (!cliente) {
      await telegramService.responder(chatId,
        `❌ No encontré ningún cliente con cédula <b>${cedulaCliente}</b>`
      );
      return;
    }

    const totalCreditos = await Credito.countDocuments({ cliente_id: cliente._id });
    const creditosPendientes = await Credito.countDocuments({
      cliente_id: cliente._id,
      estado: 'pendiente'
    });

    await telegramService.responder(chatId,
      `👤 <b>Datos del Cliente</b>\n\n` +
      `📛 <b>Nombre:</b> ${cliente.nombre}\n` +
      `🆔 <b>Cédula:</b> ${cliente.cedula}\n` +
      `📞 <b>Celular:</b> ${cliente.celular}\n` +
      `📍 <b>Dirección:</b> ${cliente.direccion || 'No registrada'}\n` +
      `💳 <b>Créditos totales:</b> ${totalCreditos}\n` +
      `⏳ <b>Pendientes:</b> ${creditosPendientes}`
    );

  } catch (error) {
    console.error('❌ Error mostrando cliente:', error.message);
    await telegramService.responder(chatId, '❌ Error al obtener los datos.');
  }
};

// Mostrar ayuda
const mostrarAyuda = async (chatId) => {
  await telegramService.responder(chatId,
    `🤖 <b>Comandos disponibles</b>\n\n` +
    `<b>— Cuenta —</b>\n` +
    `/start — Vincular cuenta de cobrador\n` +
    `/adminstart — Vincular cuenta de admin\n\n` +
    `<b>— Clientes —</b>\n` +
    `/mis_clientes — Ver tus clientes\n` +
    `/nuevo_cliente — Crear nuevo cliente\n` +
    `/cliente [cédula] — Ver datos de cliente\n` +
    `/editar_cliente [cédula] — Solicitar edición\n\n` +
    `<b>— Créditos —</b>\n` +
    `/pendientes — Ver créditos pendientes\n` +
    `/nuevo_credito — Crear nuevo crédito\n` +
    `/pagar [cédula] — Registrar pago\n\n` +
    `/ayuda — Ver esta lista`
  );
};

// ============================================
// PROCESADOR DE CALLBACK — botones inline
// Se llama cuando el admin presiona Aprobar/Rechazar
// ============================================
const procesarCallback = async (callbackQuery) => {
  const chatId = String(callbackQuery.from.id);
  const data = callbackQuery.data;

  // Formato del data: "aprobar_SOLICITUDID" o "rechazar_SOLICITUDID"
  const [accion, solicitudId] = data.split('_');
  const solicitud = solicitudesEdicion[solicitudId];

  if (!solicitud) {
    await telegramService.responder(chatId,
      '⚠️ Esta solicitud ya fue procesada o expiró.'
    );
    return;
  }

  if (accion === 'aprobar') {
    try {
      // Ejecutar la edición en la BD
      const connection = await getTenantConnection(solicitud.tenantId);
      const Cliente = getClienteModel(connection);

      await Cliente.findOneAndUpdate(
        { cedula: solicitud.cedula },
        { [solicitud.campo]: solicitud.valor },
        { new: true }
      );

      // Notificar al cobrador que fue aprobado
      await telegramService.responder(solicitud.cobradorChatId,
        `✅ <b>Edición aprobada</b>\n\n` +
        `Cliente: <b>${solicitud.nombreCliente}</b>\n` +
        `Campo: <b>${solicitud.campo}</b>\n` +
        `Nuevo valor: <b>${solicitud.valor}</b>`
      );

      // Confirmar al admin
      await telegramService.responder(chatId,
        `✅ Edición aprobada y aplicada correctamente.`
      );

      console.log(`✅ Edición aprobada: ${solicitudId}`);

    } catch (error) {
      console.error('❌ Error aplicando edición:', error.message);
      await telegramService.responder(chatId, '❌ Error al aplicar la edición.');
    }

  } else if (accion === 'rechazar') {
    // Notificar al cobrador que fue rechazado
    await telegramService.responder(solicitud.cobradorChatId,
      `❌ <b>Edición rechazada</b>\n\n` +
      `Tu solicitud de editar a <b>${solicitud.nombreCliente}</b> fue rechazada por el admin.`
    );

    await telegramService.responder(chatId, '❌ Edición rechazada.');
    console.log(`❌ Edición rechazada: ${solicitudId}`);
  }

  // Eliminar solicitud procesada
  delete solicitudesEdicion[solicitudId];
};

// ============================================
// PROCESADOR PRINCIPAL DE MENSAJES
// ============================================
exports.procesarMensaje = async (req, res) => {
  try {
    const update = req.body;
    console.log('📨 Update recibido:', JSON.stringify(update));

    // ── Procesar botones inline (Aprobar/Rechazar) ──
    if (update.callback_query) {
      await procesarCallback(update.callback_query);
      return res.sendStatus(200);
    }

    const mensaje = update.message;
    if (!mensaje) return res.sendStatus(200);

    const chatId = String(mensaje.chat.id);
    const texto = mensaje.text?.trim() || '';
    const sesion = getSesion(chatId);

    console.log(`📨 Chat ${chatId}: "${texto}" | Paso: ${sesion.paso}`);

    // ============================================
    // COMANDO /start — vinculación cobrador
    // ============================================
    if (texto === '/start') {
      sesiones[chatId] = { paso: PASOS.ESPERANDO_EMPRESA };
      await telegramService.responder(chatId,
        '👋 <b>Bienvenido a Credirobo Bot</b>\n\n' +
        '¿A qué empresa perteneces?\n' +
        'Escribe el <b>ID de tu empresa</b> (ej: <code>empresa1</code>)'
      );
      return res.sendStatus(200);
    }

    // ============================================
    // COMANDO /adminstart — vinculación admin empresa
    // ============================================
    if (texto === '/adminstart') {
      sesiones[chatId] = { paso: PASOS.ESPERANDO_ADMIN_EMPRESA };
      await telegramService.responder(chatId,
        '🔐 <b>Vinculación de Administrador</b>\n\n' +
        '¿A qué empresa perteneces?\n' +
        'Escribe el <b>ID de tu empresa</b>'
      );
      return res.sendStatus(200);
    }

    // ============================================
    // COMANDO /ayuda
    // ============================================
    if (texto === '/ayuda') {
      await mostrarAyuda(chatId);
      return res.sendStatus(200);
    }

    // ============================================
    // FLUJO VINCULACIÓN ADMIN EMPRESA
    // ============================================
    if (sesion.paso === PASOS.ESPERANDO_ADMIN_EMPRESA) {
      const empresa = await verificarEmpresa(texto);
      if (!empresa) {
        await telegramService.responder(chatId,
          `❌ No encontré la empresa <b>"${texto}"</b>\n\nVerifica el ID e intenta de nuevo.`
        );
        return res.sendStatus(200);
      }

      sesiones[chatId] = {
        paso: PASOS.ESPERANDO_ADMIN_EMAIL,
        tenantId: texto.toLowerCase().trim(),
        nombreEmpresa: empresa.nombre,
        adminEmail: empresa.email
      };

      await telegramService.responder(chatId,
        `✅ Empresa <b>${empresa.nombre}</b> encontrada.\n\n` +
        `Escribe el <b>email registrado</b> de tu empresa:`
      );
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.ESPERANDO_ADMIN_EMAIL) {
      const emailIngresado = texto.toLowerCase().trim();

      // Verificar que el email coincida con el de la empresa
      if (emailIngresado !== sesion.adminEmail) {
        await telegramService.responder(chatId,
          `❌ El email no coincide con el registrado.\n\nIntenta de nuevo o contacta al superadmin.`
        );
        return res.sendStatus(200);
      }

      // Vincular admin con este chat
      await vincularAdminEmpresa(sesion.tenantId, chatId);

      sesiones[chatId] = {
        paso: PASOS.ADMIN_VINCULADO,
        tenantId: sesion.tenantId,
        nombreEmpresa: sesion.nombreEmpresa
      };

      await telegramService.responder(chatId,
        `🎉 <b>¡Vinculado como administrador!</b>\n\n` +
        `Empresa: <b>${sesion.nombreEmpresa}</b>\n\n` +
        `Recibirás notificaciones y solicitudes de edición aquí.`
      );
      return res.sendStatus(200);
    }

    // ============================================
    // FLUJO VINCULACIÓN COBRADOR
    // ============================================
    if (sesion.paso === PASOS.ESPERANDO_EMPRESA) {
      const empresa = await verificarEmpresa(texto);
      if (!empresa) {
        await telegramService.responder(chatId,
          `❌ No encontré la empresa <b>"${texto}"</b>\n\nVerifica el ID e intenta de nuevo.`
        );
        return res.sendStatus(200);
      }

      sesiones[chatId] = {
        paso: PASOS.ESPERANDO_CEDULA,
        tenantId: texto.toLowerCase().trim()
      };

      await telegramService.responder(chatId,
        `✅ Empresa <b>${empresa.nombre}</b> encontrada.\n\n¿Cuál es tu número de cédula?`
      );
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.ESPERANDO_CEDULA) {
      const cobrador = await buscarCobrador(sesion.tenantId, texto);
      if (!cobrador) {
        await telegramService.responder(chatId,
          `❌ No encontré ningún cobrador con cédula <b>${texto}</b>\n\nVerifica tu cédula o contacta al admin.`
        );
        return res.sendStatus(200);
      }

      await vincularCobrador(sesion.tenantId, texto, chatId);

      sesiones[chatId] = {
        paso: PASOS.VINCULADO,
        tenantId: sesion.tenantId,
        cobradorId: String(cobrador._id),
        nombre: cobrador.nombre
      };

      await telegramService.responder(chatId,
        `🎉 <b>¡Vinculado exitosamente!</b>\n\n` +
        `Bienvenido, <b>${cobrador.nombre}</b>\n\n` +
        `Usa /ayuda para ver los comandos disponibles.`
      );
      return res.sendStatus(200);
    }

    // ============================================
    // FLUJO CREAR CLIENTE — paso a paso
    // ============================================
    if (sesion.paso === PASOS.CREANDO_CLIENTE_NOMBRE) {
      sesiones[chatId] = { ...sesion, paso: PASOS.CREANDO_CLIENTE_CEDULA, nombre: texto };
      await telegramService.responder(chatId, '🆔 ¿Cuál es la <b>cédula</b> del cliente?');
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.CREANDO_CLIENTE_CEDULA) {
      // Verificar que la cédula no esté ya registrada
      const connection = await getTenantConnection(sesion.tenantId);
      const Cliente = getClienteModel(connection);
      const existe = await Cliente.findOne({ cedula: texto.trim() });

      if (existe) {
        await telegramService.responder(chatId,
          `⚠️ Ya existe un cliente con la cédula <b>${texto}</b>\n\nIngresa una cédula diferente:`
        );
        return res.sendStatus(200);
      }

      sesiones[chatId] = { ...sesion, paso: PASOS.CREANDO_CLIENTE_CELULAR, cedula: texto.trim() };
      await telegramService.responder(chatId, '📞 ¿Cuál es el <b>celular</b> del cliente?');
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.CREANDO_CLIENTE_CELULAR) {
      sesiones[chatId] = { ...sesion, paso: PASOS.CREANDO_CLIENTE_DIRECCION, celular: texto.trim() };
      await telegramService.responder(chatId, '📍 ¿Cuál es la <b>dirección</b> del cliente?\n\n(Escribe <code>no</code> para omitir)');
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.CREANDO_CLIENTE_DIRECCION) {
      try {
        const connection = await getTenantConnection(sesion.tenantId);
        const Cliente = getClienteModel(connection);

        const nuevoCliente = new Cliente({
          nombre: sesion.nombre,
          cedula: sesion.cedula,
          celular: sesion.celular,
          direccion: texto.toLowerCase() === 'no' ? '' : texto.trim(),
          cobrador_id: sesion.cobradorId
        });

        await nuevoCliente.save();

        // Volver al estado vinculado
        sesiones[chatId] = {
          paso: PASOS.VINCULADO,
          tenantId: sesion.tenantId,
          cobradorId: sesion.cobradorId,
          nombre: sesion.nombre
        };

        await telegramService.responder(chatId,
          `✅ <b>Cliente creado exitosamente</b>\n\n` +
          `📛 Nombre: ${sesion.nombre}\n` +
          `🆔 Cédula: ${sesion.cedula}\n` +
          `📞 Celular: ${sesion.celular}\n` +
          `📍 Dirección: ${texto.toLowerCase() === 'no' ? 'No registrada' : texto.trim()}`
        );

      } catch (error) {
        console.error('❌ Error creando cliente:', error.message);
        await telegramService.responder(chatId, '❌ Error al crear el cliente. Intenta de nuevo.');
        sesiones[chatId] = { paso: PASOS.VINCULADO, tenantId: sesion.tenantId, cobradorId: sesion.cobradorId, nombre: sesion.nombre };
      }
      return res.sendStatus(200);
    }

    // ============================================
    // FLUJO CREAR CRÉDITO — paso a paso
    // ============================================
    if (sesion.paso === PASOS.CREANDO_CREDITO_CEDULA) {
      const connection = await getTenantConnection(sesion.tenantId);
      const Cliente = getClienteModel(connection);
      const cliente = await Cliente.findOne({ cedula: texto.trim(), cobrador_id: sesion.cobradorId });

      if (!cliente) {
        await telegramService.responder(chatId,
          `❌ No encontré ningún cliente con cédula <b>${texto}</b> asignado a ti.\n\nVerifica la cédula:`
        );
        return res.sendStatus(200);
      }

      // Verificar que no tenga crédito activo
      const Credito = getCreditoModel(connection);
      const creditoActivo = await Credito.findOne({ cliente_id: cliente._id, estado: 'pendiente' });

      if (creditoActivo) {
        await telegramService.responder(chatId,
          `⚠️ <b>${cliente.nombre}</b> ya tiene un crédito activo.\n\nDebe saldar el crédito actual antes de crear uno nuevo.`
        );
        sesiones[chatId] = { paso: PASOS.VINCULADO, tenantId: sesion.tenantId, cobradorId: sesion.cobradorId, nombre: sesion.nombre };
        return res.sendStatus(200);
      }

      sesiones[chatId] = { ...sesion, paso: PASOS.CREANDO_CREDITO_MONTO, clienteId: String(cliente._id), nombreCliente: cliente.nombre };
      await telegramService.responder(chatId,
        `👤 Cliente: <b>${cliente.nombre}</b>\n\n` +
        `💰 ¿Cuál es el <b>monto a prestar</b>?\n(Solo números, ej: <code>500000</code>)`
      );
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.CREANDO_CREDITO_MONTO) {
      const monto = parseFloat(texto.replace(/\./g, '').replace(',', '.'));

      if (isNaN(monto) || monto < 100000) {
        await telegramService.responder(chatId,
          `⚠️ El monto mínimo es <b>$100,000</b>\n\nIngresa un monto válido:`
        );
        return res.sendStatus(200);
      }

      sesiones[chatId] = { ...sesion, paso: PASOS.CREANDO_CREDITO_FECHA, montoPrestado: monto };
      await telegramService.responder(chatId,
        `💰 Monto: <b>$${monto.toLocaleString('es-CO')}</b>\n` +
        `💵 A cobrar: <b>$${(monto * 1.3).toLocaleString('es-CO')}</b> (30% de interés)\n\n` +
        `📅 ¿Cuál es la <b>fecha de pago</b>?\n(Formato: <code>DD/MM/YYYY</code>, máximo 15 días)`
      );
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.CREANDO_CREDITO_FECHA) {
      // Parsear fecha DD/MM/YYYY
      const partes = texto.split('/');
      if (partes.length !== 3) {
        await telegramService.responder(chatId,
          `⚠️ Formato incorrecto. Usa <code>DD/MM/YYYY</code>\n\nEjemplo: <code>30/03/2026</code>`
        );
        return res.sendStatus(200);
      }

      const fechaPago = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
      const hoy = new Date();
      const maxFecha = new Date();
      maxFecha.setDate(maxFecha.getDate() + 15);

      if (isNaN(fechaPago.getTime())) {
        await telegramService.responder(chatId, `⚠️ Fecha inválida. Usa el formato <code>DD/MM/YYYY</code>`);
        return res.sendStatus(200);
      }

      if (fechaPago > maxFecha) {
        await telegramService.responder(chatId,
          `⚠️ El plazo máximo es <b>15 días</b>\n` +
          `Fecha límite: <b>${maxFecha.toLocaleDateString('es-CO')}</b>\n\nIngresa otra fecha:`
        );
        return res.sendStatus(200);
      }

      try {
        const connection = await getTenantConnection(sesion.tenantId);
        const Credito = getCreditoModel(connection);

        const montoPrestado = sesion.montoPrestado;
        const montoAPagar = montoPrestado * 1.3;
        const comisionCobrador = montoPrestado * 0.2;

        const nuevoCredito = new Credito({
          cliente_id: sesion.clienteId,
          cobrador_id: sesion.cobradorId,
          monto_prestado: montoPrestado,
          monto_por_pagar: montoAPagar,
          comision_cobrador: comisionCobrador,
          fecha_origen: hoy,
          fecha_pago: fechaPago,
          estado: 'pendiente'
        });

        await nuevoCredito.save();

        sesiones[chatId] = {
          paso: PASOS.VINCULADO,
          tenantId: sesion.tenantId,
          cobradorId: sesion.cobradorId,
          nombre: sesion.nombre
        };

        await telegramService.responder(chatId,
          `✅ <b>Crédito creado exitosamente</b>\n\n` +
          `👤 Cliente: ${sesion.nombreCliente}\n` +
          `💰 Prestado: $${montoPrestado.toLocaleString('es-CO')}\n` +
          `💵 A cobrar: $${montoAPagar.toLocaleString('es-CO')}\n` +
          `📅 Fecha límite: ${fechaPago.toLocaleDateString('es-CO')}`
        );

      } catch (error) {
        console.error('❌ Error creando crédito:', error.message);
        await telegramService.responder(chatId, '❌ Error al crear el crédito.');
        sesiones[chatId] = { paso: PASOS.VINCULADO, tenantId: sesion.tenantId, cobradorId: sesion.cobradorId, nombre: sesion.nombre };
      }
      return res.sendStatus(200);
    }

    // ============================================
    // FLUJO EDITAR CLIENTE — requiere aprobación admin
    // ============================================
    if (sesion.paso === PASOS.EDITANDO_CLIENTE_CAMPO) {
      const camposPermitidos = ['nombre', 'celular', 'direccion'];
      const campo = texto.toLowerCase().trim();

      if (!camposPermitidos.includes(campo)) {
        await telegramService.responder(chatId,
          `⚠️ Campo no válido. Solo puedes editar:\n` +
          `<code>nombre</code>, <code>celular</code>, <code>direccion</code>\n\nEscribe el campo:`
        );
        return res.sendStatus(200);
      }

      sesiones[chatId] = { ...sesion, paso: PASOS.EDITANDO_CLIENTE_VALOR, campo };
      await telegramService.responder(chatId,
        `✏️ ¿Cuál es el <b>nuevo valor</b> para <b>${campo}</b>?`
      );
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.EDITANDO_CLIENTE_VALOR) {
      try {
        // Obtener el admin de la empresa
        const adminConnection = await getAdminConnection();
        const Empresa = getEmpresaModel(adminConnection);
        const empresa = await Empresa.findOne({ tenantId: sesion.tenantId });

        if (!empresa?.admin_telegram_chat_id) {
          await telegramService.responder(chatId,
            `⚠️ El administrador de tu empresa no está vinculado al bot.\n\n` +
            `Pídele que escriba <b>/adminstart</b> al bot para vincularse.`
          );
          sesiones[chatId] = { paso: PASOS.VINCULADO, tenantId: sesion.tenantId, cobradorId: sesion.cobradorId, nombre: sesion.nombre };
          return res.sendStatus(200);
        }

        // Crear ID único para esta solicitud
        const solicitudId = Date.now().toString();

        // Guardar solicitud pendiente
        solicitudesEdicion[solicitudId] = {
          cobradorChatId: chatId,
          tenantId: sesion.tenantId,
          cedula: sesion.cedulaCliente,
          nombreCliente: sesion.nombreCliente,
          campo: sesion.campo,
          valor: texto.trim()
        };

        // Notificar al admin con botones de aprobar/rechazar
        await telegramService.enviarMensajeConBotones(
          empresa.admin_telegram_chat_id,
          `📝 <b>Solicitud de Edición</b>\n\n` +
          `👤 Cobrador: <b>${sesion.nombre}</b>\n` +
          `🧑 Cliente: <b>${sesion.nombreCliente}</b> (${sesion.cedulaCliente})\n` +
          `✏️ Campo: <b>${sesion.campo}</b>\n` +
          `🔄 Nuevo valor: <b>${texto.trim()}</b>`,
          [
            [
              { text: '✅ Aprobar', callback_data: `aprobar_${solicitudId}` },
              { text: '❌ Rechazar', callback_data: `rechazar_${solicitudId}` }
            ]
          ]
        );

        sesiones[chatId] = {
          paso: PASOS.VINCULADO,
          tenantId: sesion.tenantId,
          cobradorId: sesion.cobradorId,
          nombre: sesion.nombre
        };

        await telegramService.responder(chatId,
          `⏳ <b>Solicitud enviada al administrador</b>\n\n` +
          `Te notificaré cuando sea aprobada o rechazada.`
        );

      } catch (error) {
        console.error('❌ Error enviando solicitud:', error.message);
        await telegramService.responder(chatId, '❌ Error al enviar la solicitud.');
        sesiones[chatId] = { paso: PASOS.VINCULADO, tenantId: sesion.tenantId, cobradorId: sesion.cobradorId, nombre: sesion.nombre };
      }
      return res.sendStatus(200);
    }

    // ============================================
    // COMANDOS — requieren estar vinculado como cobrador
    // ============================================
    if (sesion.paso !== PASOS.VINCULADO) {
      await telegramService.responder(chatId,
        '⚠️ Primero debes vincular tu cuenta.\n\nEscribe /start para comenzar.'
      );
      return res.sendStatus(200);
    }

    const { tenantId, cobradorId } = sesion;

    // /mis_clientes
    if (texto === '/mis_clientes') {
      await mostrarMisClientes(chatId, tenantId, cobradorId);
      return res.sendStatus(200);
    }

    // /pendientes
    if (texto === '/pendientes') {
      await mostrarPendientes(chatId, tenantId, cobradorId);
      return res.sendStatus(200);
    }

    // /nuevo_cliente
    if (texto === '/nuevo_cliente') {
      sesiones[chatId] = { ...sesion, paso: PASOS.CREANDO_CLIENTE_NOMBRE };
      await telegramService.responder(chatId,
        '👤 <b>Crear nuevo cliente</b>\n\n¿Cuál es el <b>nombre completo</b> del cliente?'
      );
      return res.sendStatus(200);
    }

    // /nuevo_credito
    if (texto === '/nuevo_credito') {
      sesiones[chatId] = { ...sesion, paso: PASOS.CREANDO_CREDITO_CEDULA };
      await telegramService.responder(chatId,
        '💳 <b>Crear nuevo crédito</b>\n\n¿Cuál es la <b>cédula del cliente</b>?'
      );
      return res.sendStatus(200);
    }

    // /pagar [cédula]
    if (texto.startsWith('/pagar')) {
      const partes = texto.split(' ');
      if (partes.length < 2) {
        await telegramService.responder(chatId,
          '⚠️ Uso: <code>/pagar [cédula del cliente]</code>'
        );
        return res.sendStatus(200);
      }
      await procesarPago(chatId, tenantId, partes[1]);
      return res.sendStatus(200);
    }

    // /cliente [cédula]
    if (texto.startsWith('/cliente')) {
      const partes = texto.split(' ');
      if (partes.length < 2) {
        await telegramService.responder(chatId,
          '⚠️ Uso: <code>/cliente [cédula del cliente]</code>'
        );
        return res.sendStatus(200);
      }
      await mostrarCliente(chatId, tenantId, partes[1]);
      return res.sendStatus(200);
    }

    // /editar_cliente [cédula]
    if (texto.startsWith('/editar_cliente')) {
      const partes = texto.split(' ');
      if (partes.length < 2) {
        await telegramService.responder(chatId,
          '⚠️ Uso: <code>/editar_cliente [cédula del cliente]</code>'
        );
        return res.sendStatus(200);
      }

      // Verificar que el cliente existe y pertenece al cobrador
      const connection = await getTenantConnection(tenantId);
      const Cliente = getClienteModel(connection);
      const cliente = await Cliente.findOne({ cedula: partes[1].trim(), cobrador_id: cobradorId });

      if (!cliente) {
        await telegramService.responder(chatId,
          `❌ No encontré ningún cliente con cédula <b>${partes[1]}</b> asignado a ti.`
        );
        return res.sendStatus(200);
      }

      sesiones[chatId] = {
        ...sesion,
        paso: PASOS.EDITANDO_CLIENTE_CAMPO,
        cedulaCliente: partes[1].trim(),
        nombreCliente: cliente.nombre
      };

      await telegramService.responder(chatId,
        `✏️ <b>Editar cliente: ${cliente.nombre}</b>\n\n` +
        `¿Qué campo quieres editar?\n\n` +
        `<code>nombre</code> — Nombre completo\n` +
        `<code>celular</code> — Número de celular\n` +
        `<code>direccion</code> — Dirección`
      );
      return res.sendStatus(200);
    }

    // Mensaje no reconocido
    await telegramService.responder(chatId,
      '🤔 No entendí ese comando.\nUsa /ayuda para ver los comandos disponibles.'
    );
    return res.sendStatus(200);

  } catch (error) {
    console.error('❌ Error procesando mensaje:', error.message);
    console.error('Stack:', error.stack);
    return res.sendStatus(200);
  }
};