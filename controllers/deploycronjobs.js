//load database
const Datastore = require('nedb');
const path = require("path");
const db = new Datastore({filename: __dirname + '/deploycronjobs/deploycronjobs.db'});
let fs = require('fs');
let db_name = "deploycronjobs.db";
const exec = require('child_process').exec;

db.loadDatabase(function (err) {
    if (err) throw err; // no hope, just terminate
});

exports.list = function(callback){
    var db = new Datastore({ filename: __dirname + '/deploycronjobs/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        callback(docs);
    });
};

exports.get = function(req, res){
    var db = new Datastore({ filename: __dirname + '/deploycronjobs/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        res.json(docs);
    });
};

exports.delete = function(){
    fs.unlink(__dirname + '/deploycronjobs/' + db_name);
};

exports.create_new = function(req, res){
    let server = req.body.server;
    let job = req.body.job;


    db.find({'server_id': server, 'cron_id': job}, function (err, deployedcrons) {
        if(err){
            return res.json({resCode: 400, err: err});
        }else{
            if(deployedcrons.length > 0){
                return res.json({resCode: 400, err: 'Task already exist'});
            }
        }

        var serversdb = new Datastore({ filename: __dirname + '/servers/servers.db' });
        serversdb.loadDatabase(function (err) {
        });

        var cronsdb = new Datastore({ filename: __dirname + '/cronjobs/cronjobs.db' });
        cronsdb.loadDatabase(function (err) {
        });

        serversdb.find({_id: server}, function (err, serverdata) {
            if (err) {
                return res.json({resCode: 400, err: err});
            }
            cronsdb.find({_id: job}, function (err, crondata) {
                if (err) {
                    return res.json({resCode: 400, err: err});
                }

                let _data = {};

                _data.server_id = serverdata[0]._id;
                _data.cron_id = crondata[0]._id;
                _data.status = 'pending';

                //Inserting data in db
                db.insert(_data, function (err, newRow) {
                    if(err){
                        return res.json({resCode: 400, err: err});
                    }


                    res.json({resCode: 200, data: _data}); //releasing the UI

                    let _data_to_send = {};
                    _data_to_send.server_details = serverdata[0];
                    _data_to_send.cron_details = crondata[0];
                    _data_to_send._id = newRow._id;

                    //start deploying and update database status when done;
                    exports.deployCrons(_data_to_send);
                });
            });
        });
    });

};

exports.deployCrons = function(data){

    let crontab_string = "";
    let log_folder = (data.server_details.distribution === 'centos' ? centos_log_folder : ubuntu_log_folder);

    let stderr = path.join(log_folder, data.cron_details._id + ".stderr");
    let stdout = path.join(log_folder, data.cron_details._id + ".stdout");
    let log_file = path.join(log_folder, data.cron_details._id + ".log");


    crontab_string += " (((( " + data.cron_details.job + " )))) 3>&1 1>&2 2>&3 > " + stdout + " | tee " + stderr;

    crontab_string += "; if [ -s " + stderr + " ]" +
        "; then echo CronRun @ Error >> " + log_file +
        "; date >> " + log_file +
        "; cat " + stderr + " >> " + log_file +
        "; else echo CronRun @ Success >> "  + log_file +
        "; date >> " + log_file +
        "; cat " + stdout + " >> " + log_file +
        "; fi";

    crontab_string += "\n";

    var components = data.cron_details.schedule.split(" ");
    let minute = components[0];
    let hour = components[1];
    let day = components[2];
    let month = components[3];
    let weekday = components[4];
    let name = data.cron_details._id;

    let job = crontab_string; //data.cron_details.job + "  3>&1 1>&2 2>&3  > " + log_file;


    //* * * * * /usr/bin/php /var/www/html/info.php 3>&1 1>&2 2>&3 | cat >> /var/log/WzryoHYEL0xwfy9s.log; date >> /var/log/WzryoHYEL0xwfy9s.log;


    let hostname = data.server_details.hostname;

    let extra_vars = "hostname="+hostname+" " +
        "name='"+name+"' " +
        "minute='"+minute+"' " +
        "hour='"+hour+"' " +
        "day='"+day+"' " +
        "weekday='"+weekday+"' " +
        "month='"+month+"' " +
        "job='"+job+"'";


    let ansible_playbook_file = ansible_playbook_path + "addCron.yaml";
    let ansible_cmd = '/usr/bin/ansible-playbook '+ansible_playbook_file+' --extra-vars "'+extra_vars+'"';

    exec(ansible_cmd, function (stderr, stdout) {
       console.log(stderr);
       if(!stderr){
           updateStatus(data._id, 'completed');
       }else{
           updateStatus(data._id, 'not_completed');
       }
       console.log(stdout);
    });


};

exports.update = function(data){
    db.update({_id: data._id}, data);
};

function updateStatus (_id, status){
    db.update({_id: _id},{$set: {status: status}});
}

exports.remove = function(req, res){

    let data = req.body;

    db.findOne({_id: data._id}, function (err, deployedCron) {
        if(!err) {

            var cronsdb = new Datastore({filename: __dirname + '/cronjobs/cronjobs.db'});
            cronsdb.loadDatabase(function (err) {
            });

            var serversdb = new Datastore({ filename: __dirname + '/servers/servers.db' });
            serversdb.loadDatabase(function (err) {
            });


            serversdb.findOne({_id: deployedCron.server_id}, function (err, serverdata) {
                if (err) {
                    return res.json({resCode: 400, err: err});
                }

                cronsdb.findOne({_id: deployedCron.cron_id}, function (err, crondata) {
                    if (!err) {
                        let name = crondata._id;
                        let hostname = serverdata.hostname;

                        db.remove({_id: data._id}, function (err) {
                            if(!err) {

                                let extra_vars = "hostname=" + hostname + " name='" + name + "'";

                                console.log(extra_vars);

                                let ansible_playbook_file = ansible_playbook_path + "removeCron.yaml";
                                let ansible_cmd = '/usr/bin/ansible-playbook ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

                                exec(ansible_cmd, function (stderr, stdout) {
                                    console.log(stderr);
                                    console.log(stdout);
                                });

                                res.json({resCode: 200, message: 'Removed'});
                            }
                        });
                    }
                });
            });
        }
    });



};