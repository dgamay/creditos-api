const router = require('express').Router();
const ctrl = require('../controllers/credito.controller');

router.post('/', ctrl.create);
router.get('/cliente', ctrl.getByCliente);
router.get('/cobrador', ctrl.getPendientesByCobrador);

module.exports = router;
