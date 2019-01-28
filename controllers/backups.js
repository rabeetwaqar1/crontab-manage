//load database
const Datastore = require('nedb');
const db = new Datastore({filename: __dirname + '/backups/backups.db'});
const serversdb = new Datastore({filename: __dirname + '/servers/servers.db'});
let db_name = "backups.db";

db.loadDatabase();

exports.list = function(req, res){
    db.loadDatabase();
    serversdb.loadDatabase();
    db.find({}).sort({ created_at: -1 }).exec(function(err, docs){
        serversdb.find({}).sort({created: -1}).exec(function (err, servers) {
            let response = {};
            response.servers = JSON.stringify(HELPER.arrayToHash(servers));
            response.backups = JSON.stringify(docs);
            response.routes = JSON.stringify(ROUTES);

            return res.render('backups', response);
        });
    });
};

exports.get = function(req, res){
    let _id = req.query._id;
    db.loadDatabase();
    db.find({_id: _id}, function(err, docs){
        if(!err && docs.length > 0){
            return res.json(RESPONSE.success(docs));
        }else{
            return res.json(RESPONSE.failure(err));
        }
    });
};


exports.add = function(req, res){
    let data = req.body;
    db.loadDatabase();
    db.insert(data, function (err, success) {
        if(err){
            return res.json(RESPONSE.failure(err));
        }else{
            return res.json(RESPONSE.success(data, 'Added'));
        }
    });
};

exports.restore = function(req, res){
    let data = req.body;
    let _id = data._id;
    let cmd = "";
    db.loadDatabase();
    
    db.find({_id: _id}, function (err, backupdata) {
        if(!err && backupdata.length > 0){


            serversdb.loadDatabase();

            let server_id = backupdata[0].server_id;

            serversdb.find({_id: server_id}, function (err, serverdata) {
                if(!err && serverdata.length > 0){

                    let crontab_string = backupdata[0].crontab_string;
                    let hostname = serverdata[0].hostname;
                    let final_string = "";

                    if(crontab_string.indexOf("\n") > -1){
                        let split_string = crontab_string.split("\n");
                        final_string = split_string.join("\\n");
                    }

                    cmd = "echo '"+ final_string + "' > " + crontab_file_path;

                    HELPER.executeCommand(cmd, function (callback) {
                        if (!callback.status) {
                            return res.json(RESPONSE.failure(callback.stderr));
                        }

                        cmd = cat_executable + " " + crontab_file_path + " | crontab -";

                        let extra_vars = "hostname='" + hostname + "' cmd='" + cmd + "' dir='"+crontab_file_path+"'";

                        let ansible_playbook_file = ansible_playbook_path + "restoreCrontab.yaml";
                        cmd = ansible_executable + ' ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

                        HELPER.executeCommand(cmd, function (callback) {
                            if (!callback.status) {
                                return res.json(RESPONSE.failure(callback.stderr));
                            }

                            return res.json(RESPONSE.success([], 'Restored'));

                        });
                    });

                }else{
                    return res.json(RESPONSE.failure("No server found"));
                }
            });
        }else{
            return res.json(RESPONSE.failure("No backup found"));
        }
    });
};

exports.update = function(req, res){
    let data = req.body;
    db.loadDatabase();
    db.update({_id: data._id}, data, function (err, success) {
        if(err){
            return res.json(RESPONSE.failure(err));
        }else{
            return res.json(RESPONSE.success(data, 'Updated'));
        }
    });
};


exports.delete = function(req, res){
    let data = req.body;
    db.loadDatabase();
    db.remove({_id: data._id}, function (err, success) {
        if(err){
            return res.json(RESPONSE.failure(err));
        }else{
            return res.json(RESPONSE.success(data, 'Removed'));
        }
    });
};