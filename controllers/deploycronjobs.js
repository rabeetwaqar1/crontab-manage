//load database
const Datastore = require('nedb');
const path = require("path");
const db = new Datastore({filename: __dirname + '/deploycronjobs/deploycronjobs.db'});
const serversdb = new Datastore({ filename: __dirname + '/servers/servers.db' });
const cronsdb = new Datastore({ filename: __dirname + '/cronjobs/cronjobs.db' });

exports.list = function(req, res){
    db.loadDatabase();
    serversdb.loadDatabase();
    cronsdb.loadDatabase();

    let servers = {};
    let crons = {};

    serversdb.find({}, function (err, serversdata) {
        for(let k = 0; k < serversdata.length; k++){
            let server_id = serversdata[k]._id;
            if(!servers[server_id]){
                servers[server_id] = serversdata[k];
            }
        }


        cronsdb.find({}, function (err, cronsdata) {
            for(let k = 0; k < cronsdata.length; k++){
                let cron_id = cronsdata[k]._id;
                if(!crons[cron_id]){
                    crons[cron_id] = cronsdata[k];
                }
            }

            db.find({}).sort({created: -1}).exec(function (err, docs) {
                let response = {};

                for (let i = 0; i < docs.length; i++) {
                    let server_id = docs[i].server_id;
                    let cron_id = docs[i].cron_id;

                    if(servers[server_id]){
                        docs[i].server_details = servers[server_id];
                    }

                    if(crons[cron_id]){
                        docs[i].cron_details = crons[cron_id];
                    }
                }

                response.deployedcrons = JSON.stringify(docs);
                response.serversdata = JSON.stringify(serversdata);
                response.cronsdata = JSON.stringify(cronsdata);
                response.routes = JSON.stringify(ROUTES);

                return res.render('deploycronjobs', response);
            });
        });
    });
};

exports.get = function(req, res){

    db.loadDatabase();

    serversdb.loadDatabase();

    cronsdb.loadDatabase();

    let servers = {};
    let crons = {};

    serversdb.find({}, function (err, serversdata) {
        for(let k = 0; k < serversdata.length; k++){
            let server_id = serversdata[k]._id;
            if(!servers[server_id]){
                servers[server_id] = serversdata[k];
            }
        }


        cronsdb.find({}, function (err, cronsdata) {
            for(let k = 0; k < cronsdata.length; k++){
                let cron_id = cronsdata[k]._id;
                if(!crons[cron_id]){
                    crons[cron_id] = cronsdata[k];
                }
            }

            db.find({}).sort({created: -1}).exec(function (err, docs) {
                let response = {};

                for (let i = 0; i < docs.length; i++) {
                    let server_id = docs[i].server_id;
                    let cron_id = docs[i].cron_id;

                    if(servers[server_id]){
                        docs[i].server_details = servers[server_id];
                    }

                    if(crons[cron_id]){
                        docs[i].cron_details = crons[cron_id];
                    }
                }

                response.deployedcrons = JSON.stringify(docs);

                return res.json(RESPONSE.success(docs));
            });
        });
    });

};

exports.add = function(req, res){
    let server = req.body.server;
    let job = req.body.job;

    db.loadDatabase();

    db.find({'server_id': server, 'cron_id': job}, function (err, deployedcrons) {
        if(err){
            return res.json(RESPONSE.failure(err));
        }else{
            if(deployedcrons.length > 0){
                return res.json(RESPONSE.failure("Cron already deployed"));
            }
        }

        serversdb.loadDatabase();

        cronsdb.loadDatabase();

        serversdb.find({_id: server}, function (err, serverdata) {
            if (err) {
                return res.json(RESPONSE.failure(err));
            }
            cronsdb.find({_id: job}, function (err, crondata) {
                if (err) {
                    return res.json(RESPONSE.failure(err));
                }

                let _data = {};

                _data.server_id = serverdata[0]._id;
                _data.cron_id = crondata[0]._id;
                _data.status = 'pending';
                _data.created = new Date().getTime();

                //Inserting data in db
                db.insert(_data, function (err, newRow) {
                    if(err){
                        return res.json(RESPONSE.failure(err));
                    }

                    let _data_to_send = {};
                    _data_to_send.server_details = serverdata[0];
                    _data_to_send.cron_details = crondata[0];
                    _data_to_send._id = newRow._id;

                    //start deploying and update database status when done;
                    exports.deployCrons(res, _data_to_send);
                });
            });
        });
    });

};

exports.deploy = function(req, res){
    let _id = req.body._id;

    db.loadDatabase();

    serversdb.loadDatabase();

    cronsdb.loadDatabase();

    db.find({_id: _id}, function (err, deployedcrons) {
        if (err) {
            return res.json(RESPONSE.failure(err));
        }
        serversdb.find({_id: deployedcrons[0].server_id}, function (err, serverdata) {
            if (err) {
                return res.json(RESPONSE.failure(err));
            }
            cronsdb.find({_id: deployedcrons[0].cron_id}, function (err, crondata) {
                if (err) {
                    return res.json(RESPONSE.failure(err));
                }
                let _data_to_send = {};
                _data_to_send.server_details = serverdata[0];
                _data_to_send.cron_details = crondata[0];
                _data_to_send._id = _id;
                exports.deployCrons(res, _data_to_send);
            });
        });
    });
};

exports.deployCrons = function(res, data){

    let crontab_string = "";

    let stderr = path.join(log_folder, data.cron_details._id + ".stderr");
    let stdout = path.join(log_folder, data.cron_details._id + ".stdout");
    let log_file = path.join(log_folder, data.cron_details._id + ".log");


    crontab_string += "( " + data.cron_details.job + " ) > " + stderr + " 2>&1" ;
    crontab_string += "; if [ \\$?\ -gt 0 ]" +
        "; then echo CronRun @ Error >> " + log_file +
        "; date >> " + log_file +
        "; cat " + stderr + " >> " + log_file +
        "; else echo CronRun @ Success >> "  + log_file +
        "; date >> " + log_file +
        "; fi";

    /*
    OLD COMMAND
    crontab_string += " (((( " + data.cron_details.job + " )))) 3>&1 1>&2 2>&3 > " + stdout + " | tee " + stderr;
    crontab_string += "; if [ -s " + stderr + " ]" +
        "; then echo CronRun @ Error >> " + log_file +
        "; date >> " + log_file +
        "; cat " + stderr + " >> " + log_file +
        "; else echo CronRun @ Success >> "  + log_file +
        "; date >> " + log_file +
        "; cat " + stdout + " >> " + log_file +
        "; fi";*/

    crontab_string += "\n";

    let components = data.cron_details.schedule.split(" ");
    let minute = components[0];
    let hour = components[1];
    let day = components[2];
    let month = components[3];
    let weekday = components[4];
    let cron_id = data.cron_details._id;

    let disabled = (data.cron_details.commented === "true" ? 'yes' : 'no');

    let job = crontab_string;

    let hostname = data.server_details.hostname;

    let extra_vars = "hostname="+hostname+" " +
        "cron_id='"+cron_id+"' " +
        "minute='"+minute+"' " +
        "hour='"+hour+"' " +
        "day='"+day+"' " +
        "weekday='"+weekday+"' " +
        "month='"+month+"' " +
        "job='"+job+"' " +
        "dest_txt_dir='"+dest_txt_file_path+"' " +
        "disabled='"+disabled+"'";


    let ansible_playbook_file = ansible_playbook_path + "addCron.yaml";
    let cmd = ansible_executable + ' '+ansible_playbook_file+' --extra-vars "'+extra_vars+'"';

    db.loadDatabase();

    HELPER.executeCommand(cmd, function (callback) {
        if (!callback.status) {
            db.update({_id: data._id},{$set: {status: 'not_deployed'}}, function (err) {
                return res.json(RESPONSE.failure(callback.stderr));
            });
        }

        db.update({_id: data._id},{$set: {status: 'deployed'}}, function (err) {
            return res.json(RESPONSE.success(data, 'Deployed'));
        });

    });
};

exports.update = function(req, res){
    let data = req.body;
    db.loadDatabase();
    db.update({_id: data._id}, data, function (err, updated) {
        if(!err && updated){
            return res.json(RESPONSE.success(updated));
        }else{
            return res.json(RESPONSE.failure(err));
        }
    });
};


exports.delete = function(req, res){

    let data = req.body;
    let cmd = "";

    db.loadDatabase();


    db.findOne({_id: data._id}, function (err, deployedCron) {
        if(!err) {

            cronsdb.loadDatabase();

            serversdb.loadDatabase();

            serversdb.find({_id: deployedCron.server_id}, function (err, serverdata) {
                if (!err && serverdata.length === 0) {
                    db.remove({_id: data._id});
                    return res.json(RESPONSE.success());
                }

                cronsdb.find({_id: deployedCron.cron_id}, function (err, crondata) {
                        if (!err && crondata.length === 0) {
                            db.remove({_id: data._id});
                            return res.json(RESPONSE.success());
                        }

                        let cron_id = crondata[0]._id;
                        let hostname = serverdata[0].hostname;

                        db.remove({_id: data._id}, function (err) {
                            if(!err) {

                                cmd = sed_executable + " -i.bak '/" + cron_id + "/d' " + dest_txt_file_path;

                                let log_path = path.join(log_folder, cron_id);

                                let extra_vars = "hostname=" + hostname + " cron_id='" + cron_id + "' cmd='"+cmd+"' dest_text_dir='"+dest_txt_file_path+"' log_path='"+log_path+"'";

                                let ansible_playbook_file = ansible_playbook_path + "removeCron.yaml";
                                cmd = ansible_executable + ' ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

                                HELPER.executeCommand(cmd, function (callback) {
                                    if (!callback.status) {
                                        return res.json(RESPONSE.failure(callback.stderr));
                                    }
                                    return res.json(RESPONSE.success());
                                });
                            }
                        });

                });
            });
        }
    });
};