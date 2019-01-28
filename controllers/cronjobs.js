//load database
const Datastore = require('nedb');
const db = new Datastore({filename: __dirname + '/cronjobs/cronjobs.db'});
const serversdb = new Datastore({ filename: __dirname + '/servers/servers.db' });

db.loadDatabase();

exports.list = function(req, res){
    db.loadDatabase();
    serversdb.loadDatabase();
    db.find({}).sort({ created: -1 }).exec(function(err, docs) {
        serversdb.find({}).sort({ created: -1 }).exec(function(err, servers){
            let response = {};

            response.servers = JSON.stringify(HELPER.arrayToHash(servers));
            response.cronjobs = JSON.stringify(docs);
            response.routes = JSON.stringify(ROUTES);

            return res.render('cronjobs', response);
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


exports.add = function(req, res){
    let data = req.body;
    db.loadDatabase();
    db.find({job: data.job.trim(), schedule: data.schedule.trim()}, function (err, crondata) {
        if(!err && crondata.length === 0) {
            data.created = new Date().getTime();
            db.insert(data, function (err, success) {
                if (err) {
                    return res.json(RESPONSE.failure(err));
                } else {
                    return res.json(RESPONSE.success(data, 'Added'));
                }
            });
        }else{
            return res.json(RESPONSE.failure("Cronjob already exists with name - " + crondata[0].name));
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