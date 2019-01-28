//load database
const Datastore = require('nedb');
const db = new Datastore({filename: __dirname + '/analytics/analytics.db'});
const deploycronsdb = new Datastore({ filename: __dirname + '/deploycronjobs/deploycronjobs.db' });
const importedcrontabsdb = new Datastore({filename: __dirname + '/importcrontab/importcrontab.db'});
const uniquedb = new Datastore({ filename: __dirname + '/unique/unique.db' });

exports.list = function(req, res){
    let total_deployed = 0,
    unique_errors = 0,
    cron_not_in_use = 0,
    hours_to_minus = 12,
    response = {};

    response.routes = JSON.stringify(ROUTES);

    deploycronsdb.loadDatabase();
    uniquedb.loadDatabase();
    importedcrontabsdb.loadDatabase();

    let current_date = new Date();
    let last_hour = current_date.setHours(current_date.getHours() - hours_to_minus);

    uniquedb.count({created: {$gte: last_hour}},function (err, uniqueCount) {
        if (!err && uniqueCount > 0) {
            unique_errors = uniqueCount;
        }

        deploycronsdb.count({status: 'deployed'}, function (err, depCount) {
            if (!err && depCount > 0) {
                total_deployed = depCount;
            }

            response.error_crons = JSON.stringify([{name: 'Success', y: total_deployed}, {name: 'Error', y: unique_errors}]);


            importedcrontabsdb.find({}, function (err, importeddata) {
                if(!err && importeddata.length > 0){
                    for(let i = 0; i < importeddata.length; i++){
                        let cron_string = importeddata[i].crontab_string;
                        let split_string = cron_string.split("\n");
                        for(let k = 0; k < split_string.length; k++ ) {

                            let line = split_string[k];
                            line = line.replace(/\t+/g, ' ');
                            let regex = /^((\@[a-zA-Z]+\s+)|(([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+))/;
                            let job = line.replace(regex, '').trim();
                            let schedule = line.replace(job, '').trim();

                            if(schedule.match(/^#/)){
                                schedule = schedule.replace(/ /g,'');
                                schedule = schedule.substr(1);
                                let first_char = schedule.charAt(0);
                                if(!isNaN(first_char) || first_char.indexOf('*') > -1){
                                    cron_not_in_use++;
                                }
                            }
                        }
                    }
                }

                response.crons_not_in_use = JSON.stringify([{name: 'In Use', y: total_deployed}, {name: 'Not In Use', y: cron_not_in_use}]);

                return res.render('analytics', response);
            });
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
        if(!err && data.length === 0) {
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