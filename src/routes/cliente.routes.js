const router = require('express').Router();
const ctrl = require('../controllers/cliente.controller');

router.post('/', ctrl.create);
router.get('/', ctrl.getByCobrador);

module.exports = router;
