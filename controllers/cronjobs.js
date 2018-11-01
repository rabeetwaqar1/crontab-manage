//load database
const Datastore = require('nedb');
const path = require("path");
const db = new Datastore({filename: __dirname + '/cronjobs/cronjobs.db'});
let fs = require('fs');
let db_name = "cronjobs.db";

db.loadDatabase(function (err) {
    if (err) throw err; // no hope, just terminate
});

exports.list = function(callback){
    var db = new Datastore({ filename: __dirname + '/cronjobs/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        callback(docs);
    });
};

exports.get = function(req, res){
    var db = new Datastore({ filename: __dirname + '/cronjobs/' + db_name });
    db.loadDatabase(function (err) {
    });
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        res.json(docs);
    });
};

exports.delete = function(){
    fs.unlink(__dirname + '/cronjobs/' + db_name);
};

exports.create_new = function(data){
    db.insert(data);
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