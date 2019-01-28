const ROUTE = 'backups';
const routes = require("../managers/routes").routes;
const controller = require('../controllers/'+ROUTE);
const api = require('express').Router();


module.exports = function(app) {

    //view routes
    app.get(routes[ROUTE], controller.list);

    //api routes
    api.get(routes[ROUTE], controller.get);
    api.post(routes[ROUTE], controller.add);
    api.put(routes[ROUTE], controller.update);
    api.delete(routes[ROUTE], controller.delete);
    api.post(routes[ROUTE] + '/restore', controller.restore);

    app.use('/api', api); //this will prepend /api as a route for every api route.
};


