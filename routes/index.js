var express = require('express');
var router = express.Router();
global.$models = require("../models");

router.get('/', (req, res) => res.send({ message: "Fictional Railway Editor" }) );

//Define Middleware
const _auth = require('../middlewares/AuthMiddleware');

/**
 * User
 */

const UserController = require('../controllers/UserController');

router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.get('/myself', _auth, UserController.getMyself);
router.put('/myself', _auth, UserController.setMyself);
router.put('/my-password', _auth, UserController.setMyPassword);

/**
 * Misc
 */

router.all('*', (req, res) => res.status(404).send({ message: "Route Not Found" }) );

module.exports = router;
