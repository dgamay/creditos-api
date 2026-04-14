exports.procesarMensaje = async (req, res) => {
  try {
    const update = req.body;
    console.log('📨 Update recibido:', JSON.stringify(update));
    console.log('🔑 BOT_TOKEN existe:', !!process.env.BOT_TOKEN);
    console.log('🔑 BOT_TOKEN primeros 10 chars:', process.env.BOT_TOKEN?.substring(0, 10));

    // Ignorar updates sin mensaje
    if (!update.message && !update.callback_query) {
      return res.sendStatus(200);
    }

    const mensaje = update.message;
    if (!mensaje) return res.sendStatus(200);

    const chatId = String(mensaje.chat.id);
    const texto = mensaje.text?.trim() || '';
    const sesion = getSesion(chatId);

    console.log(`📨 Mensaje de ${chatId}: "${texto}" | Paso: ${sesion.paso}`);

    // ============================================
    // COMANDO /start — inicia vinculación
    // ============================================
    if (texto === '/start') {
      sesiones[chatId] = { paso: PASOS.ESPERANDO_EMPRESA };
      await telegramService.responder(chatId,
        '👋 <b>Bienvenido a Credirobo Bot</b>\n\n' +
        '¿A qué empresa perteneces?\n' +
        'Escribe el <b>ID de tu empresa</b> (ej: <code>empresa1</code>)'
      );
      console.log('✅ Respuesta /start enviada');
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
    // FLUJO DE VINCULACIÓN
    // ============================================
    if (sesion.paso === PASOS.ESPERANDO_EMPRESA) {
      const empresa = await verificarEmpresa(texto);
      if (!empresa) {
        await telegramService.responder(chatId,
          `❌ No encontré la empresa <b>"${texto}"</b>\n\n` +
          'Verifica el ID con tu administrador e intenta de nuevo.'
        );
        return res.sendStatus(200);
      }

      sesiones[chatId] = {
        paso: PASOS.ESPERANDO_CEDULA,
        tenantId: texto.toLowerCase().trim()
      };

      await telegramService.responder(chatId,
        `✅ Empresa <b>${empresa.nombre}</b> encontrada.\n\n` +
        '¿Cuál es tu número de cédula?'
      );
      return res.sendStatus(200);
    }

    if (sesion.paso === PASOS.ESPERANDO_CEDULA) {
      const cedula = texto.trim();
      const tenantId = sesion.tenantId;

      const cobrador = await buscarCobrador(tenantId, cedula);
      if (!cobrador) {
        await telegramService.responder(chatId,
          `❌ No encontré ningún cobrador con cédula <b>${cedula}</b>\n\n` +
          'Verifica tu cédula o contacta a tu administrador.'
        );
        return res.sendStatus(200);
      }

      await vincularCobrador(tenantId, cedula, chatId);

      sesiones[chatId] = {
        paso: PASOS.VINCULADO,
        tenantId,
        cobradorId: String(cobrador._id),
        nombre: cobrador.nombre
      };

      await telegramService.responder(chatId,
        `🎉 <b>¡Vinculado exitosamente!</b>\n\n` +
        `Bienvenido, <b>${cobrador.nombre}</b>\n\n` +
        'Usa /ayuda para ver los comandos disponibles.'
      );
      return res.sendStatus(200);
    }

    // ============================================
    // COMANDOS — requieren estar vinculado
    // ============================================
    if (sesion.paso !== PASOS.VINCULADO) {
      await telegramService.responder(chatId,
        '⚠️ Primero debes vincular tu cuenta.\nEscribe /start para comenzar.'
      );
      return res.sendStatus(200);
    }

    const { tenantId, cobradorId } = sesion;

    if (texto === '/pendientes') {
      await mostrarPendientes(chatId, tenantId, cobradorId);
      return res.sendStatus(200);
    }

    if (texto.startsWith('/pagar')) {
      const partes = texto.split(' ');
      if (partes.length < 2) {
        await telegramService.responder(chatId,
          '⚠️ Uso correcto:\n<code>/pagar [cédula del cliente]</code>'
        );
        return res.sendStatus(200);
      }
      await procesarPago(chatId, tenantId, partes[1]);
      return res.sendStatus(200);
    }

    if (texto.startsWith('/cliente')) {
      const partes = texto.split(' ');
      if (partes.length < 2) {
        await telegramService.responder(chatId,
          '⚠️ Uso correcto:\n<code>/cliente [cédula del cliente]</code>'
        );
        return res.sendStatus(200);
      }
      await mostrarCliente(chatId, tenantId, partes[1]);
      return res.sendStatus(200);
    }

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