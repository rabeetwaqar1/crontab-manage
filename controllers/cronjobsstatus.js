//load database
const Datastore = require('nedb');
const db = new Datastore({filename: __dirname + '/cronjobsstatus/cronjobsstatus.db'});
const uniquedb = new Datastore({ filename: __dirname + '/unique/unique.db' });
const slackdb = new Datastore({ filename: __dirname + '/slack/slack.db' });
let db_name = "cronjobsstatus.db";
let Slack = require('slack');
const bot = new Slack();

db.loadDatabase();
uniquedb.loadDatabase();

exports.listener = function(req, res){

    res.json(RESPONSE.success()); //released the request

    let body = req.body;

    if(body && typeof body !== undefined) {

        slackdb.loadDatabase();

        slackdb.find({}, function (err, slackdata) {
            if(!err && slackdata.length > 0){
                let data = slackdata[0];
                let formatted_text = "";
                for(let k = 0; k < body.length; k++) {
                    let out = body[k].output;
                    formatted_text += "Status: " + out[0] + " - Hostname: " + body[k].hostname + " - CronId: " + body[k].cron_id + " - date: "+out[1] + " Error: "+ out[2];
                }
                let token = data.token;

                //Send message to slack
                bot.chat.postMessage({
                    token: token,
                    channel: data.channel,
                    text: formatted_text
                }).then(console.log).catch(console.log);
            }
        });


        body.forEach(function (bdy) {

            bdy.created = new Date().getTime();
            bdy.hostname = bdy.hostname.trim();
            bdy.cron_id = bdy.cron_id.trim();

            //insert data into unique db

            uniquedb.loadDatabase();

            uniquedb.find({hostname: bdy.hostname, cron_id: bdy.cron_id}, function (err, docs) {
                if(!err && docs.length === 0) {

                    uniquedb.insert(bdy, function (err, success) {
                        if (!err && success) {
                            console.log('Unique log inserted  - ' + JSON.stringify(bdy));
                        }
                    });
                }else{
                    uniquedb.update({hostname: bdy.hostname, cron_id: bdy.cron_id}, bdy, function (err, success) {
                        if (!err && success) {
                            console.log('Unique log updated  - ' + JSON.stringify(bdy));
                        }
                    });
                }
            });
        });

        //insert data into db
        db.insert(body, function (err, success) {
            if(!err && success){
                console.log('Log inserted  - ' + JSON.stringify(body));
            }
        });

        //Send message to dashboard
        //socket.emit("cronsstatus", body);
    }

};


exports.list = function(req, res){

    uniquedb.loadDatabase();

    uniquedb.find({}).sort({created: -1}).exec(function (err, docs) {
        let response = {};
        response.routes = JSON.stringify(ROUTES);
        response.cronjobsstatus = JSON.stringify(docs);
        return res.render('cronjobsstatus', response);
    });
};


exports.get = function(req, res){

    if(req.query.hostname && req.query.cron_id){
        db.loadDatabase();
        db.find({hostname: req.query.hostname, cron_id: req.query.cron_id}).sort({ created: -1 }).exec(function(err, docs){
            if(!err && docs.length > 0){
                return res.json(RESPONSE.success(docs));
            }else{
                return res.json(RESPONSE.failure(err));
            }
        });

        return false;
    }

    uniquedb.loadDatabase();

    uniquedb.find({}).sort({created: -1}).exec(function (err, docs) {
        if(!err && docs.length > 0){
            return res.json(RESPONSE.success(docs));
        }else{
            return res.json(RESPONSE.failure(err));
        }
    });
};


exports.add = function(req, res){
    db.loadDatabase();
    let data = req.body;
    db.insert(data, function (err, success) {
        if(err){
            return res.json(RESPONSE.failure(err));
        }else{
            return res.json(RESPONSE.success(data, 'Added'));
        }
    });
};

exports.update = function(req, res){
    db.loadDatabase();
    let data = req.body;
    db.update({_id: data._id}, data, function (err, success) {
        if(err){
            return res.json(RESPONSE.failure(err));
        }else{
            return res.json(RESPONSE.success(data, 'Updated'));
        }
    });
};

exports.delete = function(req, res){
    db.loadDatabase();
    uniquedb.loadDatabase();
    uniquedb.remove({}, {multi: true}, function (err, success) {
        db.remove({}, {multi: true}, function (err, success) {
            if (!err && success) {
                return res.json(RESPONSE.success([], 'Removed'));
            } else {
                return res.json(RESPONSE.failure(err));
            }
        });
    });
};