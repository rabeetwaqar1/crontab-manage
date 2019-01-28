const exec = require('child_process').exec;

exports.helper = {
    executeCommand: function (cmd, callback) {
        console.log('Executing cmd: ' + cmd);
        let response = {};
        exec(cmd, function (stderr, stdout) {
            if(stderr) {
                console.log(stderr);
                response.status = false;
                response.stderr = stderr;
            }else{
                response.status = true;
                response.stdout = stdout;
            }
            return callback(response);
        });
    },

    die: function (msg) {
        console.log(msg);
        return false;
    },
    arrayToHash: function (array) {
        let hash = {};
        for(let i = 0; i < array.length; i++){
            let atom = array[i];
            if(!hash[atom._id]){
                hash[atom._id] = atom;
            }
        }
        return hash;
    }
};
