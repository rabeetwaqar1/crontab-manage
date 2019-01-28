const ROUTE = 'importcrontab';
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
    api.get(routes[ROUTE] + '/getCrontab', controller.getCrontab);
    api.post(routes[ROUTE] + '/synchronize', controller.synchronize);
    api.post(routes[ROUTE] + '/deploy', controller.deploy);
    api.post(routes[ROUTE] + '/backup', controller.backup);

    app.use('/api', api); //this will prepend /api as a route for every api route.
};


