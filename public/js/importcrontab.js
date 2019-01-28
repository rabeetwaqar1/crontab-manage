function updateServers(){
    let con = '';
    con += '<option value="null">Select Server</option>';
    for (let key in servers) {
        if (servers.hasOwnProperty(key)) {
            let server_id = key;
            let server_data = servers[key];
            con += '<option value="' + server_id + '">' + server_data.name + ' - ' + server_data.username + '@' + server_data.hostname + '</option>';
        }
    }

    $('#select-import-server').html(con);

}
function newImportJob(){

    $("#add_import").modal("show");


    $("#import-save").unbind("click"); // remove existing events attached to this
    $("#import-save").click(function(){

        let _id = $("#select-import-server").val();

        let fields = ['select-import-server'];
        let errors = validateFields(fields);

        if(errors){
            toastr.error("Please fill the form");
            return false;
        }

        let params = {_id: _id};

        ajx(routes.importcrontab, 'post', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });
    });
}

function showCrontabString(_id) {

    let params = {_id: _id};
    ajx(routes.importcrontab + '/getCrontab', 'get', params, function(response){
        if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else {
            let crontab_string = response.data[0].crontab_string;
            $('#crontab_string').html(crontab_string);
            $("#crontab_string_modal").modal("show");
        }
    });

}

function syncImportJob(_id) {
    messageBox("<p> Are you sure want to synchroize crontab from server?", "Confirm Synchronize", null, null, function() {
        let params = {_id: _id};
        ajx(routes.importcrontab + '/synchronize', 'post', params, function (response) {
            if (response.resCode === 400) {
                toastr.error(JSON.stringify(response.error));
            } else {
                toastr.success(JSON.stringify(response.message));
            }
        });
    });
}


function backupCrontab(_id){
    messageBox("<p> Are you sure want to backup this crontab?", "Confirm backup", null, null, function(){
        ajx(routes.importcrontab + '/backup', 'post', {_id: _id}, function (response) {
            if (response.resCode === 400) {
                toastr.error(JSON.stringify(response.error));
            } else {
                toastr.success(JSON.stringify(response.message));
            }
        });
    });
}


function deployCrontab(_id){
    messageBox("<p> Are you sure want to deploy this crontab to server?", "Confirm deploy", null, null, function(){
        ajx(routes.importcrontab + '/deploy', 'post', {_id: _id}, function (response) {
            if (response.resCode === 400) {
                toastr.error(JSON.stringify(response.error));
            } else {
                toastr.success(JSON.stringify(response.message));
            }
        });
    });
}

function deleteImportJob(_id){
    messageBox("<p> Type 'DELETE' to delete! </p><br><input id='input_delete' type='text' class='form-control'>", "Confirm delete", null, null, function(){
        if($('#input_delete').val() === 'DELETE') {
            ajx(routes.importcrontab, 'delete', {_id: _id}, function (response) {
                if (response.resCode === 400) {
                    toastr.error(JSON.stringify(response.error));
                } else {
                    location.reload();
                }
            });
        }
    });
}
