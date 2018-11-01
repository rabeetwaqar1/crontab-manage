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


function newServer(){

    $("#add_server").modal("show");

    $("#server-name").val("");
    $("#server-hostname").val("");
    $("#server-username").val("");
    $("#server-password").val("");


    $("#server-save").unbind("click"); // remove existing events attached to this
    $("#server-save").click(function(){
        let name = $("#server-name").val();
        let hostname = $("#server-hostname").val();
        let username = $("#server-username").val();
        let distribution = $("#server-distribution").val();
        let password = $("#server-password").val();


        let fields = ['server-name', 'server-hostname', 'server-username', 'server-distribution', 'server-password'];
        let errors = validateFields(fields);

        if(errors){
            $('.form-group').addClass('has-error');
            return false;
        }

        $('.form-group').removeClass('has-error');

        loader('show');
        $.post(routes.servers_api.add, {name: name, hostname: hostname, username: username, distribution: distribution, password: password}, function(response){
            location.reload();
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
        $("#server-distribution").val(server.distribution);
    }
    $("#server-save").unbind("click"); // remove existing events attached to this
    $("#server-save").click(function(){

        let name = $("#server-name").val();
        let hostname = $("#server-hostname").val();
        let username = $("#server-username").val();
        let distribution = $("#server-distribution").val();

        let fields = ['server-name', 'server-hostname', 'server-username', 'server-distribution'];
        let errors = validateFields(fields);

        if(errors){
            $('.form-group').addClass('has-error');
            return false;
        }

        $('.form-group').removeClass('has-error');

        loader('show');

        $.post(routes.servers_api.update, {_id: server._id, name: name, hostname: hostname, username: username, distribution: distribution}, function(response){
            location.reload();
        });
    });
}

function deleteServer(_id){
    // TODO fix this. pass callback properly
    messageBox("<p> Do you want to delete this server, this will also revoke ssh key from the server? </p>", "Confirm delete", null, null, function(){
        loader('show');
        $.post(routes.servers_api.remove, {_id: _id}, function(){
            location.reload();
        });
    });
}

function validateFields(fields){
    let error = false;
    for(let i = 0; i < fields.length; i++){
        let field = fields[i];
        if($('#'+field).val() === '' || $('#'+field).val() === 'null'){
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