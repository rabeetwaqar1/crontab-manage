function updateServers(){
    let con = '';
    con += '<option value="null">Select Server</option>';
    for (let i = 0; i < servers.length; i++) {
        con += '<option value="' + servers[i]._id + '">' + servers[i].name + ' - ' + servers[i].username + '@' + servers[i].hostname + '</option>';
    }
    $('#select-server').html(con);

}

function updateCrons() {
    let con = '';
    con += '<option value="null">Select CronJob</option>';
    for (let i = 0; i < crons.length; i++) {
        con += '<option value="' + crons[i]._id + '">' + crons[i].name + ' - ' + crons[i].job + '</option>';
    }
    $('#select-cron').html(con);
}


function newDeployJob(){

    $("#add_deploycronjob").modal("show");


    $("#deploy-save").unbind("click"); // remove existing events attached to this
    $("#deploy-save").click(function(){

        let server = $("#select-server").val();
        let job = $("#select-cron").val();

        let fields = ['select-server', 'select-cron'];
        let errors = validateFields(fields);

        if(errors){
            toastr.error("Please fill the form");
            return false;
        }

        let params = {server: server, job: job};

        ajx(routes.deploycronjobs, 'post', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });
    });
}

function editServer(_id){

    $('#password_div').css('display', 'none');

    let server = null;
    servers.forEach(function(sev){
        if(sev._id === _id)
            server = sev;
    });
    if(server) {

        $("#add_server").modal("show");

        $("#server-name").val(server.name);
        $("#server-hostname").val(server.hostname);
        $("#server-username").val(server.username);
    }
    $("#server-save").unbind("click"); // remove existing events attached to this
    $("#server-save").click(function(){

        let name = $("#server-name").val();
        let hostname = $("#server-hostname").val();
        let username = $("#server-username").val();

        let fields = ['server-name', 'server-hostname', 'server-username'];
        let errors = validateFields(fields);

        if(errors){
            toastr.error("Please fill the form");
            return false;
        }

        let params = {_id: server._id, name: name, hostname: hostname, username: username};

        ajx(routes.deploycronjobs, 'put', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });

    });
}




function deployCron(_id){
    messageBox("<p> Are you sure you want to deploy this cronjob to server? </p>", "Confirm deploy", null, null, function(){
        ajx(routes.deploycronjobs + '/deploy', 'post', {_id: _id}, function (response) {
            if (response.resCode === 400) {
                toastr.error(JSON.stringify(response.error));
            } else {
                location.reload();
            }
        });
    });
}

function deleteCron(_id){
    messageBox("<p> Type 'DELETE' to delete! </p><br><input id='input_delete' type='text' class='form-control'>", "Confirm delete", null, null, function(){
        if($('#input_delete').val() === 'DELETE') {
            ajx(routes.deploycronjobs, 'delete', {_id: _id}, function (response) {
                if (response.resCode === 400) {
                    toastr.error(JSON.stringify(response.error));
                } else {
                    location.reload();
                }
            });
        }
    });
}
