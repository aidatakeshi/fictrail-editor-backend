var express = require('express');
var router = express.Router();
global.$models = require("../models");

router.get('/', (req, res) => res.send({ message: "Fictional Railway Editor" }) );

/**
 * Define Middleware
 */
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const _auth = {
    root: AuthMiddleware('root'),
    user: AuthMiddleware('user'),
    viewer: AuthMiddleware('viewer'),
    editor: AuthMiddleware('editor'),
    owner: AuthMiddleware('owner'),
};

/**
 * User
 */

const UserController = require('../controllers/UserController');

router.post('/login', UserController.login);
router.post('/logout', UserController.logout);
router.get('/myself', _auth.user, UserController.getMyself);
router.put('/myself', _auth.user, UserController.setMyself);
router.put('/my-password', _auth.user, UserController.setMyPassword);

router.post('/user', _auth.root, UserController.newUser);
router.get('/user', _auth.root, UserController.getUsers);
router.get('/user/:user_id', _auth.root, UserController.getUser);
router.put('/user/:user_id', _auth.root, UserController.setUser);
router.delete('/user/:user_id', _auth.root, UserController.removeUser);

/**
 * Project
 */

const ProjectController = require('../controllers/ProjectController');

router.post('/project', _auth.user, ProjectController.newProject);
router.get('/project', _auth.user, ProjectController.getProjects);
router.get('/project/:project_id', _auth.viewer, ProjectController.getProject);
router.put('/project/:project_id', _auth.editor, ProjectController.setProject);
router.delete('/project/:project_id', _auth.owner, ProjectController.removeProject);
router.put('/project/:project_id/assign', _auth.owner, ProjectController.assignProject);
router.put('/project/:project_id/unassign', _auth.owner, ProjectController.unassignProject);
router.get('/project/:project_id/assignment', _auth.owner, ProjectController.getProjectAssignments);
router.get('/project/:project_id/settings', _auth.viewer, ProjectController.getProjectSettings);
router.put('/project/:project_id/settings', _auth.editor, ProjectController.setProjectSettings);

/**
 * Misc
 */

router.all('*', (req, res) => res.status(404).send({ message: "Route Not Found" }) );

module.exports = router;
