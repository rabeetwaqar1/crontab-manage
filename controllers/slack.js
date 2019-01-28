//load database
const Datastore = require('nedb');
const db = new Datastore({filename: __dirname + '/slack/slack.db'});
let db_name = "slack.db";

db.loadDatabase();

exports.list = function(req, res){
    db.loadDatabase();
    db.find({}).sort({ created: -1 }).exec(function(err, docs){
        let response = {};
        response.slacks = JSON.stringify(docs);
        response.routes = JSON.stringify(ROUTES);
        return res.render('slack', response);
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
    let body = req.body;
    db.loadDatabase();
    db.find({}, function (err, slacks) {
        if(!err && slacks.length > 0){
            return res.json(RESPONSE.failure("Slack channel already exist"));
        }else{
            db.insert(body, function (err) {
                return res.json(RESPONSE.success());
            });
        }
    });
};

exports.update = function(req, res){
    let data = req.body;
    db.loadDatabase();
    db.update({_id: data._id}, data, function (err, success) {
        if(!err && success){
            return res.json(RESPONSE.success(data, 'Updated'));
        }else{
            return res.json(RESPONSE.failure('Something went wrong'));
        }
    });
};

exports.delete = function(req, res){
    let data = req.body;
    db.loadDatabase();
    db.remove({_id: data._id}, function (err, success) {
        if(!err && success){
            return res.json(RESPONSE.success(data, 'Removed'));
        }else{
            return res.json(RESPONSE.failure('Something went wrong'));
        }
    });
};