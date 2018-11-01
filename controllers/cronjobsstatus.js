//load database
const Datastore = require('nedb');
const path = require("path");
const db = new Datastore({filename: __dirname + '/cronjobsstatus/servers.db'});
let fs = require('fs');
let db_name = "cronjobsstatus.db";
const exec = require('child_process').exec;
let ssh_key_path = "~/.ssh/id_rsa.pub";


db.loadDatabase(function (err) {
    if (err) throw err; // no hope, just terminate
});

exports.list = function(callback){
    var db = new Datastore({ filename: __dirname + '/cronjobsstatus/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        callback(docs);
    });
};

exports.get = function(req, res){
    var db = new Datastore({ filename: __dirname + '/cronjobsstatus/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        res.json(docs);
    });
};

exports.delete = function(){
    fs.unlink(__dirname + '/cronjobsstatus/' + db_name);
};

exports.create_new = function(req, res){
    var data = req.body;
    let hostname = data.hostname;
    let username = data.username;
    let password = data.password;
    let name = data.name;


    let cmd = "sshpass -p '"+password+"' ssh-copy-id -i "+ssh_key_path+" "+username+"@"+hostname;

    exec(cmd, function(err) {
        if (err){
            console.log(err);
            return res.json({resCode: 400, err: err});
        }

        let _data = {
            name: name,
            hostname: hostname,
            username: username
        };

        db.insert(_data);
        return res.json({resCode: 200});
    });

};

exports.update = function(data){
    db.update({_id: data._id}, data);
};

exports.status = function(_id, stopped){
    db.update({_id: _id},{$set: {stopped: stopped}});
};

exports.remove = function(data){
    db.remove({_id: data._id}, {});
};