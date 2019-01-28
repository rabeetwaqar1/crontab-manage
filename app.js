const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const createError = require('http-errors');
const busboy = require('connect-busboy'); // for file upload
const exec = require('child_process').exec;
const fs = require('fs');
const CONSTANTS = JSON.parse(fs.readFileSync('./managers/constants.json'));

const ROUTES = require("./managers/routes").routes;
const RESPONSE = require("./managers/response").response;
const HELPER = require("./managers/helper").helper;

const bodyParser = require('body-parser');

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use(busboy()); // to support file uploads

// include all folders
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/css'));
app.use(express.static(__dirname + '/public/js'));
app.use(express.static(__dirname + '/public/lib'));
app.use(express.static(__dirname + '/public/common'));
app.set('views', __dirname + '/views');

/**
 * GLOBAL CONSTANTS
 */

global.watcher_file = CONSTANTS.watcher_file;
global.watcher_txt_file = CONSTANTS.watcher_txt_file;
global.ssh_key_path = CONSTANTS.ssh_key_path;
global.ssh_known_hosts_path = CONSTANTS.ssh_known_hosts_path;
global.ansible_playbook_path = __dirname + CONSTANTS.ansible_playbook_path;
global.source_file_path = __dirname + CONSTANTS.source_file_path + CONSTANTS.watcher_file;
global.dest_file_path = CONSTANTS.dest_file_path + CONSTANTS.watcher_file;
global.dest_txt_file_path = CONSTANTS.dest_txt_file_path + CONSTANTS.watcher_txt_file;
global.log_folder = CONSTANTS.log_folder;
global.ansible_host_file_path = CONSTANTS.ansible_host_file_path;
global.ansible_executable = CONSTANTS.ansible_executable;
global.ssh_keyscan_executable = CONSTANTS.ssh_keyscan_executable;
global.ssh_pass_executable = CONSTANTS.ssh_pass_executable;
global.ssh_copy_id_executable = CONSTANTS.ssh_copy_id_executable;
global.php_executable = CONSTANTS.php_executable;
global.cat_executable = CONSTANTS.cat_executable;
global.grep_executable = CONSTANTS.grep_executable;
global.echo_executable = CONSTANTS.echo_executable;
global.sed_executable = CONSTANTS.sed_executable;
global.RESPONSE = RESPONSE;
global.HELPER = HELPER;
global.ROUTES = ROUTES;
global.MYSQL_PASS = process.env.MYSQL_PASS;
global.LOCAL_HOSTNAME = process.env.LOCAL_HOSTNAME;
global.pem_file_path = __dirname + CONSTANTS.pem_file_path;
global.crontab_file_path = CONSTANTS.crontab_file_path;
global.awk_executable = CONSTANTS.awk_executable;

io.on('connection', function (socket) {
    global.socket = socket;
});

exec("hostname", function(err, hostname) {
    if (err){
        console.log(err);
    }else{
        global.local_hostname = hostname.trim();
    }
});


//Inject routes
require("./routes/servers")(app);
require("./routes/cronjobs")(app);
require("./routes/deploycronjobs")(app);
require("./routes/cronjobsstatus")(app);
require("./routes/slack")(app);
require("./routes/importcrontab")(app);
require("./routes/backups")(app);
require("./routes/analytics")(app);


app.get('/api/routes', function (req, res) {
    let response = RESPONSE.success(ROUTES);
    return res.json(response);
});

app.get(ROUTES.logs, function (req, res) {
    let response = {};
    response.routes = JSON.stringify(ROUTES);
    return res.render('logs', response);
});

app.get(ROUTES.index, function (req, res) {
    return res.redirect(ROUTES.analytics);
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
app.set('host', (process.env.HOST || CONSTANTS.server_config.host));

// set port to 8000 or the value set by environment let PORT
app.set('port', (process.env.PORT || CONSTANTS.server_config.port));

server.listen(app.get('port'), app.get('host'), function() {
    console.log("server is listening on port " + app.get('port') + "\nnode-version:", process.versions.node);
});

module.exports = app;
