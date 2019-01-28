function newServer(){

    $("#add_server").modal("show");

    /*$("#server-name").val("");
    $("#server-hostname").val("");
    $("#server-username").val("");
    $("#server-password").val("");*/


    $("#server-save").unbind("click"); // remove existing events attached to this
    $("#server-save").click(function(){
        let name = $("#server-name").val();
        let hostname = $("#server-hostname").val();
        let username = $("#server-username").val();
        //let distribution = $("#server-distribution").val();
        let password = $("#server-password").val();
        let pem_file = $("#server-pem").val();
        let auth_type = $("#server-auth-type").val();


        let fields = ['server-name', 'server-hostname', 'server-username', 'server-auth-type'];


        if(auth_type === 'password'){
            fields[5] = 'server-password';
        }else if(auth_type === 'pem'){
            fields[5] = 'server-pem';
        }


        let errors = validateFields(fields);

        if(errors){
            $('.form-group').addClass('has-error');
            return false;
        }


        $('.form-group').removeClass('has-error');

        let params = {name: name, hostname: hostname, username: username, password: password, pem: pem_file, auth_type: auth_type};

        ajx(routes.servers, 'post', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });
    });
}

function editServer(_id){

    $('#auth_div').css('display', 'none');
    $('#password_div').css('display', 'none');
    $('#pem_div').css('display', 'none');

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
        //$("#server-distribution").val(server.distribution);
    }
    $("#server-save").unbind("click"); // remove existing events attached to this
    $("#server-save").click(function(){

        let name = $("#server-name").val();
        let hostname = $("#server-hostname").val();
        let username = $("#server-username").val();
        //let distribution = $("#server-distribution").val();

        let fields = ['server-name', 'server-hostname', 'server-username'];
        let errors = validateFields(fields);

        if(errors){
            $('.form-group').addClass('has-error');
            return false;
        }

        $('.form-group').removeClass('has-error');

        let params = {_id: _id, name: name, hostname: hostname, username: username};

        ajx(routes.servers, 'put', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });
    });
}

function deleteServer(_id){
    messageBox("<p> Type 'DELETE' to delete! </p><br><input id='input_delete' type='text' class='form-control'>", "Confirm delete", null, null, function(){
        if($('#input_delete').val() === 'DELETE') {
            ajx(routes.servers, 'delete', {_id: _id}, function (response) {
                if (response.resCode === 400) {
                    toastr.error(JSON.stringify(response.error));
                } else {
                    location.reload();
                }
            });
        }
    });
}

$('#server-auth-type').on('change', function () {

    let auth_type = $(this).val();
    if(auth_type === 'password'){
        $('#password_div').css({display: 'block'});
        $('#pem_div').css({display: 'none'});
    }else{
        $('#password_div').css({display: 'none'});
        $('#pem_div').css({display: 'block'});
    }
    return false;
});

