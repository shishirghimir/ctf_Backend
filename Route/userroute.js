const router = require('express').Router();
const userController = require('../Controller/userController');

// make a route and a controller for the user to register
router.get('/register', userController.createUser);
router.get('/login', userController.login);
router.get('/Products', userController.Products);

module.exports = router;
