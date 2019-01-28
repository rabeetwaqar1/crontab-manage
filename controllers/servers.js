//load database
const Datastore = require('nedb');
const db = new Datastore({filename: __dirname + '/servers/servers.db'});
const cronsdb = new Datastore({filename: __dirname + '/cronjobs/cronjobs.db'});
const backupsdb = new Datastore({filename: __dirname + '/backups/backups.db'});
const deploycronsdb = new Datastore({ filename: __dirname + '/deploycronjobs/deploycronjobs.db' });
const importcrontabdb = new Datastore({filename: __dirname + '/importcrontab/importcrontab.db'});
const replace = require('replace-in-file');

db.loadDatabase();

exports.list = function(req, res){
    db.loadDatabase();
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        let response = {};
        response.servers = JSON.stringify(docs);
        response.routes = JSON.stringify(ROUTES);

        return res.render('servers', response);
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


exports.add = function(req, res){

    let data = req.body;
    let hostname = data.hostname;
    let username = data.username;
    let password = data.password;
    let name = data.name;

    let auth_type = data.auth_type;
    let pem = data.pem;
    let cmd = "";

    if(auth_type === 'password') {

        cmd = ssh_keyscan_executable + " -H -t rsa " + hostname + " >> " + ssh_known_hosts_path;

        HELPER.executeCommand(cmd, function (callback) {
            if (!callback.status) {
                return res.json(RESPONSE.failure(callback.stderr));
            }

            cmd = ssh_pass_executable + " -p '" + password + "' " + ssh_copy_id_executable + " -i " + ssh_key_path + " " + username + "@" + hostname;

            HELPER.executeCommand(cmd, function (callback) {
                if (!callback.status) {
                    return res.json(RESPONSE.failure(callback.stderr));
                }

                cmd = cat_executable + ' ' + ansible_host_file_path + ' | ' + grep_executable + ' "' + hostname + '"';

                HELPER.executeCommand(cmd, function (callback) {
                    if (callback.stderr && callback.stderr !== "") {
                        let content = "'";
                        content += hostname + " " + "ansible_ssh_user=" + username;
                        content += "'";
                        cmd = echo_executable + " " + content + " >> " + ansible_host_file_path;

                        HELPER.executeCommand(cmd, function (callback) {
                            if (!callback.status) {
                                return res.json(RESPONSE.failure(callback.stderr));
                            }

                            //new host entry added play ansible now
                            console.log('New entry added in host ...');
                            playAnsible();
                        });
                    } else {

                        //already exists play ansible
                        console.log('Host file contains hostname already ...');
                        playAnsible();
                    }
                });

            });
        });
    }else if(auth_type === 'pem'){

        cmd = ssh_keyscan_executable + " -H -t rsa " + hostname + " >> " + ssh_known_hosts_path;

        HELPER.executeCommand(cmd, function (callback) {
            if (!callback.status) {
                return res.json(RESPONSE.failure(callback.stderr));
            }


            let pem_file_name = pem_file_path + "pem-" + username + "-" + hostname + ".pem";
            cmd = echo_executable + " '" + pem + "' > " + pem_file_name + " && chmod 600 " + pem_file_name;

            HELPER.executeCommand(cmd, function (callback) {
                if (!callback.status) {
                    return res.json(RESPONSE.failure(callback.stderr));
                }

                cmd = cat_executable + ' ' + ansible_host_file_path + ' | ' + grep_executable + ' "' + hostname + '"';

                HELPER.executeCommand(cmd, function (callback) {
                    if (callback.stderr && callback.stderr !== "") {
                        let content = "'";
                        content += hostname + " " + "ansible_ssh_user=" + username + " " + "ansible_ssh_private_key_file=" + pem_file_name;
                        content += "'";
                        cmd = echo_executable + " " + content + " >> " + ansible_host_file_path;

                        HELPER.executeCommand(cmd, function (callback) {
                            if (!callback.status) {
                                return res.json(RESPONSE.failure(callback.stderr));
                            }
                            //new host entry added play ansible now
                            console.log('New pem entry added in host ...');
                            playAnsible();
                        });

                    } else {

                        //already exists play ansible
                        console.log('Host file contains pem hostname already ...');
                        playAnsible();
                    }
                });

            });
        });
    }

    function playAnsible() {


        let job = php_executable+ " " + dest_file_path + " >> " + log_folder + "/cron_watcher.log";

        let extra_vars = "hostname='" + hostname + "' source_dir='" + source_file_path + "' dest_dir='" + dest_file_path + "' " +
            "job='" + job + "' dest_txt_dir='" + dest_txt_file_path + "' content='" + hostname + "'";

        let ansible_playbook_file = ansible_playbook_path + "copyFile.yaml";
        cmd = ansible_executable + ' ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

        HELPER.executeCommand(cmd, function (callback) {
            if (!callback.status) {
                return res.json(RESPONSE.failure(callback.stderr));
            }

            let _data = {
                name: name,
                hostname: hostname,
                username: username
            };

            db.insert(_data, function (err) {
                return res.json(RESPONSE.success(_data, 'New server added'));
            });
        });
    }

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

    db.findOne({_id: data._id}, function (err, serverdata) {
        if (err) {
            return res.json(RESPONSE.failure(err));
        }

        cmd = sed_executable + " -i.bak '/" + local_hostname + "/d' ~/.ssh/authorized_keys";

        let extra_vars = "hostname='"+serverdata.hostname+"' cmd='"+cmd+"' dest_dir_php='"+dest_file_path+"' dest_dir_txt='"+dest_txt_file_path+"'";

        let ansible_playbook_file = ansible_playbook_path + "revokeSSHKey.yaml";

        cmd = ansible_executable + ' ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

        HELPER.executeCommand(cmd, function (callback) {
            if (!callback.status) {
                return res.json(RESPONSE.failure(callback.stderr));
            }

            const options = {
                files: ansible_host_file_path,
                from: serverdata.hostname+' ansible_ssh_user='+serverdata.username,
                to: '',
            };

            replace(options)
                .then(changes => {
                    console.log('Modified files:', changes.join(', '));
                })
                .catch(error => {
                    console.error('Error occurred:', error);
                });

            cronsdb.loadDatabase();
            deploycronsdb.loadDatabase();
            importcrontabdb.loadDatabase();
            backupsdb.loadDatabase();

            let cron_ids = [];

            cronsdb.find({}, function (err, cronsdata) {
                if(!err && cronsdata.length > 0){
                    for(let i = 0; i < cronsdata.length; i++){
                        let name = cronsdata[i].name;
                        if(name.indexOf("Imported") > -1){
                            let server_id = name.split("Imported from ")[1];
                            if(server_id === data._id){
                                cron_ids.push(cronsdata[i]._id);
                            }
                        }
                    }

                    cronsdb.remove({_id: {$in: cron_ids}}, {multi: true}, function (err) {
                    });
                }
            });
            deploycronsdb.remove({server_id: data._id}, {multi: true}, function (err) {

            });
            importcrontabdb.remove({server_id: data._id}, {multi: true}, function (err) {

            });
            backupsdb.remove({server_id: data._id}, {multi: true}, function (err) {

            });
            db.remove({_id: data._id}, function (err) {
                return res.json(RESPONSE.success());
            });
        });
    });
};