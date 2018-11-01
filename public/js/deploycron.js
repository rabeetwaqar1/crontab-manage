/*jshint esversion: 6 */
/*********** MessageBox ****************/
// simply show info.  Only close button
function infoMessageBox(message, title){
    $("#info-body").html(message);
    $("#info-title").html(title);
    $("#info-popup").modal('show');
}
// like info, but for errors.
function errorMessageBox(message) {
    var msg =
        "Operation failed: " + message + ". " +
        "Please see error log for details.";
    infoMessageBox(msg, "Error");
}
// modal with full control
function messageBox(body, title, ok_text, close_text, callback){
    $("#modal-body").html(body);
    $("#modal-title").html(title);
    if (ok_text) $("#modal-button").html(ok_text);
    if(close_text) $("#modal-close-button").html(close_text);
    $("#modal-button").unbind("click"); // remove existing events attached to this
    $("#modal-button").click(callback);
    $("#popup").modal("show");
}


function fetchServers(){
    var con = '';
    con += '<option value="null">Select Server</option>';
    $.get(routes.servers_api.list, function (servers) {
            for(var i = 0; i < servers.length; i++){
                con += '<option value="'+servers[i]._id+'">'+servers[i].name+' - '+servers[i].username+'@'+servers[i].hostname+'</option>';
            }
            $('#select-server').html(con);
    });

}

function fetchCrons() {
    var con = '';
    con += '<option value="null">Select CronJob</option>';
    $.get(routes.cronjobs_api.list, function (crons) {
        for(var i = 0; i < crons.length; i++){
            con += '<option value="'+crons[i]._id+'">'+crons[i].name+' - '+crons[i].job+'</option>';
        }
        $('#select-cron').html(con);
    });
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
            alert("Please fill the form");
            return false;
        }
        loader('show');
        $.post(routes.deploycronjobs_api.add, {server: server, job: job}, function(response){
            if(response.resCode === 200) {
                location.reload();
            }else{
                alert(response.err);
                loader('hide');
            }
        });
    });
}

function editServer(_id){

    $('#password_div').css('display', 'none');

    var server = null;
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
            alert("Please fill the form");
            return false;
        }

        loader('show');

        $.post(routes.deploycronjobs_api.update, {_id: server._id, name: name, hostname: hostname, username: username}, function(response){
            location.reload();
        });
    });
}

function deleteServer(_id){
    // TODO fix this. pass callback properly
    messageBox("<p> Do you want to delete this deplolyed cron? </p>", "Confirm delete", null, null, function(){
        loader('show');
        $.post(routes.deploycronjobs_api.remove, {_id: _id}, function(){
            location.reload();
        });
    });
}

function validateFields(fields){
    let error = false;
    for(var i = 0; i < fields.length; i++){
        let field = fields[i];
        if($('#'+field).val() === '' || $('#'+field).val() == 'null'){
            error = true;
            break;
        }
    }
    return error;
}

function loader(bool) {
    if(bool === 'show'){
        $('.loader').css('display', 'block');
    }else{
        $('.loader').css('display', 'none');
    }

}