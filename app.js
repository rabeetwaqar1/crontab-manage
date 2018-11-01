/*jshint esversion: 6*/
let express = require('express');
let app = express();
let crontab = require("./controllers/crontab");
let servers = require("./controllers/servers");
let cronjobs = require("./controllers/cronjobs");
let deploycronjobs = require("./controllers/deploycronjobs");
let cronjobsstatus = require("./controllers/cronjobsstatus");
let crontabhook = require("./controllers/crontabhook");
let moment = require('moment');
let createError = require('http-errors');
let path = require('path');
let mime = require('mime-types');
let fs = require('fs');
let busboy = require('connect-busboy'); // for file upload
const exec = require('child_process').exec;
// include the routes
let routes = require("./routes").routes;

// set the view engine to ejs
app.set('view engine', 'ejs');

let bodyParser = require('body-parser');
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(busboy()); // to support file uploads

// include all folders
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/css'));
app.use(express.static(__dirname + '/public/js'));
app.set('views', __dirname + '/views');



/**
 * Global constants
 */

global.watcher_file = "cron_watcher.php";
global.watcher_txt_file = "cron_watcher.txt";
global.ssh_key_path = "~/.ssh/id_rsa.pub";
global.ansible_playbook_path = __dirname + "/controllers/playbooks/";
global.source_file_path = __dirname + "/controllers/scripts/"+watcher_file;
global.dest_file_path = "/opt/"+watcher_file;
global.dest_txt_file_path = "/opt/"+watcher_txt_file;
global.ubuntu_log_folder = "/var/log";
global.centos_log_folder = "/etc/httpd/logs";
global.ansible_host_file_path = "/etc/ansible/hosts";


exec("hostname", function(err, hostname) {
    if (err){
        console.log(err);
    }else{
        global.local_hostname = hostname.trim();
    }
});

app.get(routes.servers, function (req, res) {
    servers.list(function(docs) {
        res.render('servers', {
            routes: JSON.stringify(routes),
            backups: crontab.get_backup_names(),
            servers: JSON.stringify(docs),
        });
    });
});


// get the log file a given job. id passed as query param
app.post(routes.servers_api.add, servers.create_new);


// get the log file a given job. id passed as query param
app.post(routes.servers_api.update, function(req, res) {
    servers.update(req.body);
    res.end();
});

// get the log file a given job. id passed as query param
app.post(routes.servers_api.remove, servers.remove);

// get the log file a given job. id passed as query param
app.get(routes.servers_api.list, function(req, res) {
    servers.get(req, res);
});


app.get(routes.deploycronjobs, function (req, res) {
    deploycronjobs.list(function(docs) {
        res.render('deploycronjobs', {
            routes: JSON.stringify(routes),
            backups: crontab.get_backup_names(),
            deployedcrons: JSON.stringify(docs)
        });
    });
});


// get the log file a given job. id passed as query param
app.post(routes.deploycronjobs_api.add, deploycronjobs.create_new);


// get the log file a given job. id passed as query param
app.post(routes.deploycronjobs_api.update, function(req, res) {
    deploycronjobs.update(req.body);
    res.end();
});

// get the log file a given job. id passed as query param
app.post(routes.deploycronjobs_api.remove, deploycronjobs.remove);

// get the log file a given job. id passed as query param
app.get(routes.deploycronjobs_api.list, function(req, res) {
    deploycronjobs.get(req, res);
});

// get the log file a given job. id passed as query param
app.get(routes.crontabhook.complete, crontabhook.complete);


app.get(routes.cronjobsstatus, function (req, res) {

    cronjobsstatus.list(function(docs) {
        res.render('cronjobsstatus', {
            routes: JSON.stringify(routes),
            backups: crontab.get_backup_names(),
            servers: JSON.stringify(docs),
        });
    });
});


// get the log file a given job. id passed as query param
app.post(routes.cronjobsstatus_api.add, servers.create_new);


// get the log file a given job. id passed as query param
app.post(routes.cronjobsstatus_api.update, function(req, res) {
    cronjobsstatus.update(req.body);
    res.end();
});

// get the log file a given job. id passed as query param
app.post(routes.cronjobsstatus_api.remove, function(req, res) {
    cronjobsstatus.remove(req.body);
    res.end();
});

// get the log file a given job. id passed as query param
app.get(routes.cronjobsstatus_api.list, function(req, res) {
    cronjobsstatus.get(req, res);
});

app.get(routes.cronjobs, function (req, res) {
    cronjobs.list(function(docs) {
        res.render('cronjobs', {
            routes: JSON.stringify(routes),
            backups: crontab.get_backup_names(),
            cronjobs: JSON.stringify(docs),
        });
    });
});


// get the log file a given job. id passed as query param
app.post(routes.cronjobs_api.add, function(req, res) {
    cronjobs.create_new(req.body);
    res.end();
});


// get the log file a given job. id passed as query param
app.post(routes.cronjobs_api.update, function(req, res) {
    cronjobs.update(req.body);
    res.end();
});

// get the log file a given job. id passed as query param
app.post(routes.cronjobs_api.remove, function(req, res) {
    cronjobs.remove(req.body);
    res.end();
});

// get the log file a given job. id passed as query param
app.get(routes.cronjobs_api.list, function(req, res) {
    cronjobs.get(req, res);
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


// error handler
app.use(function(err, req, res, next) {
    let data = {};
    let statusCode = err.statusCode || 500;

    data.message = err.message || 'Internal Server Error';

    if (process.env.NODE_ENV === 'development' && err.stack) {
        data.stack = err.stack;
    }

    if (parseInt(data.statusCode) >= 500) {
        console.error(err);
    }

    res.status(statusCode).json(data);
});


// set host to 127.0.0.1 or the value set by environment let HOST
app.set('host', (process.env.HOST || '127.0.0.1'));

// set port to 8000 or the value set by environment let PORT
app.set('port', (process.env.PORT || 9000));

app.listen(app.get('port'), app.get('host'), function() {
    console.log("Node version:", process.versions.node);
});

module.exports = app;
