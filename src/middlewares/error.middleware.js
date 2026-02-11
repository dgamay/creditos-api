// Middleware de manejo de errores (base)

module.exports = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno' });
};
