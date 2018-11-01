//load database
const Datastore = require('nedb');
const path = require("path");
const db = new Datastore({filename: __dirname + '/servers/servers.db'});
let fs = require('fs');
let db_name = "servers.db";
const exec = require('child_process').exec;

db.loadDatabase(function (err) {
    if (err) throw err; // no hope, just terminate
});


exports.list = function(callback){
    var db = new Datastore({ filename: __dirname + '/servers/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        callback(docs);
    });
};

exports.get = function(req, res){
    var db = new Datastore({ filename: __dirname + '/servers/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        res.json(docs);
    });
};

exports.delete = function(){
    fs.unlink(__dirname + '/servers/' + db_name);
};
//executeCmd();
function executeCmd() {
    setTimeout(function () {
        hostname = "latency.killping.com";
        let cmd = '/bin/cat ' + ansible_host_file_path + ' | /bin/grep '+hostname;
        exec(cmd, function (err, stdout) {
            if(!stdout && stdout === ""){
                console.log('sadada')
            }
            console.log(stdout);
        });
    }, 1000);
}

exports.create_new = function(req, res){
    let data = req.body;
    let hostname = data.hostname;
    let username = data.username;
    let password = data.password;
    let name = data.name;
    let distribution = data.distribution;

    let cmd = "/usr/bin/sshpass -p '"+password+"' /usr/bin/ssh-copy-id -i "+ssh_key_path+" "+username+"@"+hostname;


    exec(cmd, function(err) {
        if (err){
            console.log(err);
            return res.json({resCode: 400, err: err});
        }

        let _data = {
            name: name,
            hostname: hostname,
            username: username,
            distribution: distribution
        };

        let cmd = 'cat ' + ansible_host_file_path + ' | grep "' + hostname + '"';

        exec(cmd, function (err, stdout) {
            if(!stdout && stdout === ""){
                let content = "'";
                content += hostname + " " + "ansible_ssh_user=" + username;
                content += "'";
                exec("echo "+ content + " >> " + ansible_host_file_path, function (err, stdout) {
                    //new host entry added play ansible now
                    console.log('New entry added in host ...');
                    playAnsible();
                });
            }else{
                //already exists play ansible
                console.log('Host file contains hostname already exist...');
                playAnsible();
            }
        });


        function playAnsible() {


            let log_folder = (distribution === 'centos' ? centos_log_folder : ubuntu_log_folder);

            let job = "/usr/bin/php " + dest_file_path + " >> " + log_folder + "/cron_watcher.log";

            let extra_vars = "hostname='" + hostname + "' source_dir='" + source_file_path + "' dest_dir='" + dest_file_path + "' " +
                "job='" + job + "' dest_txt_dir='" + dest_txt_file_path + "' content='" + hostname + "'";

            let ansible_playbook_file = ansible_playbook_path + "copyFile.yaml";
            let ansible_cmd = '/usr/bin/ansible-playbook ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

            exec(ansible_cmd, function (stderr, stdout) {
                console.log(stderr);
                console.log(stdout);
            });

            db.insert(_data);
            return res.json({resCode: 200});
        }
    });

};

exports.update = function(data){
    db.update({_id: data._id}, data);
};

exports.status = function(_id, stopped){
    db.update({_id: _id},{$set: {stopped: stopped}});
};

exports.remove = function(req, res){

    let data = req.body;

    db.findOne({_id: data._id}, function (err, serverdata) {
        if (err) {
            return res.json({resCode: 400, err: err});
        }

        let cmd = "sed -i.bak '/" + local_hostname + "/d' ~/.ssh/authorized_keys";


        let extra_vars = "hostname='"+serverdata.hostname+"' cmd='"+cmd+"' dest_dir_php='"+dest_file_path+"' dest_dir_txt='"+dest_txt_file_path+"'";

        let ansible_playbook_file = ansible_playbook_path + "revokeSSHKey.yaml";
        let ansible_cmd = '/usr/bin/ansible-playbook ' + ansible_playbook_file + ' --extra-vars "' + extra_vars + '"';

        exec(ansible_cmd, function (stderr, stdout) {
            console.log(stderr);
            if (stderr) {
                return res.json({resCode: 400, err: err});
            }
            db.remove({_id: data._id}, function (err) {
                if(!err){
                    console.log(stdout);
                    return res.json({resCode: 200, message: 'Revoked'});
                }
            });
        });
    });
};