//load database
const Datastore = require('nedb');
const db = new Datastore({filename: __dirname + '/importcrontab/importcrontab.db'});
const cronsdb = new Datastore({filename: __dirname + '/cronjobs/cronjobs.db'});
const backupsdb = new Datastore({filename: __dirname + '/backups/backups.db'});
const serversdb = new Datastore({ filename: __dirname + '/servers/servers.db' });
const deploycronsdb = new Datastore({ filename: __dirname + '/deploycronjobs/deploycronjobs.db' });

let db_name = "importcrontab.db";
const cron_parser = require('cron-parser');
const path = require("path");

db.loadDatabase();

exports.getCrontab = function(req, res){
    db.loadDatabase();
    db.find({_id: req.query._id}, function(err, docs) {
        if(err){
            return res.json(RESPONSE.failure(err));
        }else{
            return res.json(RESPONSE.success(docs));
        }
    });
};

exports.list = function(req, res){
    db.loadDatabase();
    serversdb.loadDatabase();

    db.find({}).sort({ created: -1}).exec(function(err, docs) {
        serversdb.find({}).sort({created: -1}).exec(function (err, servers) {

            let response = {};
            response.servers = JSON.stringify(HELPER.arrayToHash(servers));
            response.importcrontabs = JSON.stringify(docs);
            response.routes = JSON.stringify(ROUTES);

            return res.render('importcrontab', response);
        });
    });
};

exports.get = function(req, res){
    db.loadDatabase();
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        if(!err && docs.length > 0){
            return res.json(RESPONSE.success(docs));
        }else{
            return res.json(RESPONSE.failure(err));
        }
    });
};

exports.backup = function(req, res){
    let data = req.body;
    let _id = data._id;

    db.loadDatabase();

    db.find({_id: _id}, function (err, importdata) {

        if(!err && importdata.length > 0) {
            let server_id = importdata[0].server_id;
            let _data = {
                server_id: server_id,
                crontab_string: importdata[0].crontab_string,
                created_at: new Date().getTime()
            };

            backupsdb.loadDatabase();

            backupsdb.insert(_data, function (err) {
                return res.json(RESPONSE.success(_data, 'Backup successfull'));
            });

        }else{
            return res.json(RESPONSE.failure("No imported data of this server found"));
        }
    });
};

exports.deploy = function(req, res){

    let data = req.body;
    let _id = data._id;
    let cmd = "";

    db.loadDatabase();

    db.find({_id: _id}, function (err, importdata) {
        if(!err && importdata.length > 0){

            serversdb.loadDatabase();
            cronsdb.loadDatabase();
            deploycronsdb.loadDatabase();

            let server_id = importdata[0].server_id;

            serversdb.find({_id: server_id}, function (err, serverdata) {
                if(!err && serverdata.length === 0) {
                    return res.json(RESPONSE.failure("No server found"));
                }

                    let crontab_string = importdata[0].crontab_string;
                    let hostname = serverdata[0].hostname;
                    let final_string = "";

                    let crons_list = stringTojsonCrons(crontab_string);

                    for(let i = 0; i < crons_list.length; i++) {

                        let is_valid = crons_list[i].valid;

                        if(!is_valid){
                            final_string += crons_list[i].line + "\\n";
                        }
                    }

                    deploycronsdb.find({server_id: server_id, status: "pending"}, function (err, deploycrondata) {
                            if(!err && deploycrondata.length === 0) {
                                return res.json(RESPONSE.failure("No pending crons found for this server"));
                            }

                            let cron_ids = [];
                            for(let k = 0; k < deploycrondata.length; k++){
                                cron_ids.push(deploycrondata[k].cron_id);
                            }

                            cronsdb.find({_id: {$in: cron_ids}}, function (err, cronsdata) {
                                if(!err && cronsdata.length === 0){
                                    return res.json(RESPONSE.failure("No crons found for this server"));
                                }

                                let _data = {
                                    server_id: server_id,
                                    crontab_string: importdata[0].crontab_string,
                                    created_at: new Date().getTime()
                                };

                                //create backup
                                backupsdb.loadDatabase();

                                backupsdb.insert(_data, function (err, success) {
                                    if(!err) {
                                        console.log('Backup created with _id ' + success._id)
                                    }
                                });

                                for(let i = 0; i < cronsdata.length; i++) {

                                    let cron_id = cronsdata[i]._id;
                                    let job = cronsdata[i].job;
                                    let schedule = cronsdata[i].schedule;

                                    let stderr = path.join(log_folder, cron_id + ".stderr");
                                    let log_file = path.join(log_folder, cron_id + ".log");

                                    final_string += '#Ansible: '+cron_id + '\\n';
                                    final_string += schedule + " " + "( " + job + " ) > " + stderr + " 2>&1";
                                    final_string += "; if [ \\$?\ -gt 0 ]" +
                                        "; then echo CronRun @ Error >> " + log_file +
                                        "; date >> " + log_file +
                                        "; cat " + stderr + " >> " + log_file +
                                        "; else echo CronRun @ Success >> " + log_file +
                                        "; date >> " + log_file +
                                        "; fi";

                                    final_string += "\\n";
                                }

                                deployCrontab(cron_ids);
                            });


                    });

                    function deployCrontab(cron_ids) {

                        cmd = echo_executable+" '" + final_string + "' > " + crontab_file_path;

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

                                for(let i = 0; i < cron_ids.length; i++) {
                                    deploycronsdb.update({cron_id: cron_ids[i]}, {$set: {status: "deployed"}});
                                }

                                return res.json(RESPONSE.success([], 'Crontab deployed to server'));
                            });
                        });
                    }

            });
        }else{
            return res.json(RESPONSE.failure("No backup found"));
        }
    });

};

exports.synchronize = function(req, res){
    let data = req.body;
    let _id = data._id;

    let cmd = "";

    db.loadDatabase();

    db.find({_id: _id}, function (err, importdata) {

        if(!err && importdata.length > 0) {

            serversdb.loadDatabase();

            let server_id = importdata[0].server_id;

            serversdb.find({_id: server_id}, function (err, serverdata) {

                if (!err && serverdata.length > 0) {

                    let hostname = serverdata[0].hostname;

                    let extra_vars = "hostname='" + hostname + "' crontab_dir='" + crontab_file_path + "'";

                    let ansible_playbook_file = ansible_playbook_path + "importCrontab.yaml";
                    cmd = ansible_executable + ' ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

                    HELPER.executeCommand(cmd, function (callback) {
                        if (!callback.status) {
                            return res.json(RESPONSE.failure(callback.stderr));
                        }

                        cmd = cat_executable + " " + crontab_file_path;

                        HELPER.executeCommand(cmd, function (callback) {
                            if (!callback.status) {
                                return res.json(RESPONSE.failure(callback.stderr));
                            }

                            let crontab_string = callback.stdout.toString();

                            let crons_list = stringTojsonCrons(crontab_string);

                            for(let i = 0; i < crons_list.length; i++) {

                                if(crons_list[i].valid) {

                                    let job = crons_list[i].job;
                                    let schedule = crons_list[i].schedule;

                                    cronsdb.loadDatabase();

                                    cronsdb.find({job: job, schedule: schedule}, function (err, crondata) {
                                        if (!err && crondata.length === 0) {
                                            let _data = {
                                                name: 'Imported from ' + server_id,
                                                job: job,
                                                schedule: schedule,
                                                commented: false,
                                                created: new Date().getTime()
                                            };

                                            cronsdb.insert(_data, function (err, success) {

                                                let cron_id = success._id;

                                                console.log('Cron inserted ' + cron_id);

                                                deploycronsdb.loadDatabase();

                                                deploycronsdb.find({server_id: server_id, cron_id: cron_id}, function (err, deploycronsdata) {
                                                    if(!err && deploycronsdata.length === 0) {


                                                        let _data = {
                                                            server_id: server_id,
                                                            cron_id: cron_id,
                                                            status: 'pending',
                                                            created: new Date().getTime()
                                                        };

                                                        deploycronsdb.insert(_data, function (err, success) {
                                                            if(!err) {
                                                                console.log('Deploy cron inserted ' + success._id)
                                                            }
                                                        });
                                                    }
                                                });

                                            });
                                        }
                                    });
                                }
                            }


                            db.loadDatabase();

                            let _data = {
                                server_id: serverdata[0]._id,
                                crontab_string: crontab_string,
                                created_at: importdata[0].created_at,
                                updated_at: new Date().getTime()
                            };

                            db.update({_id: _id}, _data, function (err) {
                                return res.json(RESPONSE.success(_data, 'Synchronized'));
                            });
                        });

                    });
                }
            });
        }

    });
};

function test() {

    cmd = cat_executable + " " + crontab_file_path;

    HELPER.executeCommand(cmd, function (callback) {
        if (!callback.status) {
            return res.json(RESPONSE.failure(callback.stderr));
        }

        let crontab_string = callback.stdout.toString();
        let crons_list = stringTojsonCrons(crontab_string);

        for(let i = 0; i < crons_list.length; i++) {
            if (crons_list[i].valid) {
                console.log(crons_list[i]);
            }

        }
    });
}

function stringTojsonCrons(crontab_string){

    let cronjobs = [];

    if(crontab_string.indexOf("\n") > -1) {

        let split_string = crontab_string.split("\n");

        for (let i = 0; i < split_string.length; i++) {
            let cron = {};

            let line = split_string[i];

            line = line.replace(/\t+/g, ' ');
            let regex = /^((\@[a-zA-Z]+\s+)|(([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+))/;
            let job = line.replace(regex, '').trim();
            let schedule = line.replace(job, '').trim();

            let is_valid = false;

            try {
                is_valid = cron_parser.parseString(line).expressions.length > 0;
            } catch (e) {
            }

            //check for #Ansible and get cronId from there
            //so that it should not be inserted in cronjobs and deployedcrons database
            let cron_id = null;
            if (line.startsWith("#Ansible: ")) {
                job = split_string[i + 1];
                cron_id = line.split("#Ansible: ")[1];
            }

            if (job.indexOf("CronRun") > -1 || job.indexOf("cron_watcher") > -1) {
                is_valid = false;
            }
            cron.valid = is_valid;
            cron.job = job;
            cron.schedule = schedule;
            cron.line = line;
            cronjobs.push(cron);

        }
    }

    return cronjobs;
}

exports.add = function(req, res){
    let data = req.body;
    let server_id = data._id;

    let cmd = "";

        serversdb.loadDatabase();


        serversdb.find({_id: server_id}, function (err, serverdata) {

            if (!err && serverdata.length > 0) {

                db.loadDatabase();

                db.find({server_id: server_id}, function (err, docs) {

                    if(!err && docs.length === 0) {

                        let hostname = serverdata[0].hostname;

                        let extra_vars = "hostname='" + hostname + "' crontab_dir='" + crontab_file_path + "'";

                        let ansible_playbook_file = ansible_playbook_path + "importCrontab.yaml";
                        cmd = ansible_executable + ' ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

                        HELPER.executeCommand(cmd, function (callback) {
                            if (!callback.status) {
                                return res.json(RESPONSE.failure(callback.stderr));
                            }

                            cmd = cat_executable + " " + crontab_file_path;

                            HELPER.executeCommand(cmd, function (callback) {
                                if (!callback.status) {
                                    return res.json(RESPONSE.failure(callback.stderr));
                                }

                                let crontab_string = callback.stdout.toString();


                                let backupdata = {
                                    server_id: server_id,
                                    crontab_string: crontab_string,
                                    created_at: new Date().getTime()
                                };
                                //create backup
                                backupsdb.loadDatabase();

                                backupsdb.insert(backupdata, function (err, success) {
                                    if(!err) {
                                        console.log('Backup created with _id ' + success._id)
                                    }
                                });

                                db.loadDatabase();

                                let _data = {
                                    server_id: server_id,
                                    crontab_string: crontab_string,
                                    updated_at: new Date().getTime(),
                                    created_at: new Date().getTime()
                                };


                                let crons_list = stringTojsonCrons(crontab_string);

                                for(let i = 0; i < crons_list.length; i++) {

                                    if(crons_list[i].valid) {

                                        let job = crons_list[i].job;
                                        let schedule = crons_list[i].schedule;

                                        cronsdb.loadDatabase();

                                        cronsdb.find({job: job, schedule: schedule}, function (err, crondata) {
                                            if (!err && crondata.length === 0) {
                                                let _data = {
                                                    name: 'Imported from ' + server_id,
                                                    job: job,
                                                    schedule: schedule,
                                                    commented: false,
                                                    created: new Date().getTime()
                                                };

                                                cronsdb.insert(_data, function (err, success) {

                                                    let cron_id = success._id;

                                                    console.log('Cron inserted ' + cron_id);

                                                    deploycronsdb.loadDatabase();

                                                    deploycronsdb.find({server_id: server_id, cron_id: cron_id}, function (err, deploycronsdata) {
                                                        if(!err && deploycronsdata.length === 0) {


                                                            let _data = {
                                                                server_id: server_id,
                                                                cron_id: cron_id,
                                                                status: 'pending',
                                                                created: new Date().getTime()
                                                            };

                                                            deploycronsdb.insert(_data, function (err, success) {
                                                                if(!err) {
                                                                    console.log('Deploy cron inserted ' + success._id)
                                                                }
                                                            });
                                                        }
                                                    });

                                                });
                                            }
                                        });
                                    }
                                }

                                db.insert(_data, function (err, importdata) {
                                    return res.json(RESPONSE.success(_data, 'Cron imported'));
                                });
                            });

                        });
                    }else{
                        return res.json(RESPONSE.failure("Server crontab already imported. Please use synchronize option to refresh crontab from server"));
                    }
                });
            } else {
                return res.json(RESPONSE.failure("No server found"));
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