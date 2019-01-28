

function showCrontabString(_id) {
    let params = {_id: _id};
    ajx(routes.backups, 'get', params, function(response){
        if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else {
            let crontab_string = response.data[0].crontab_string;
            $('#crontab_string').html(crontab_string);
            $("#crontab_string_modal").modal("show");
        }
    });
}

function restoreBackup(_id){
    messageBox("<p> Are you sure want to restore this backup to server?", "Confirm restore", null, null, function(){
        ajx(routes.backups + '/restore', 'post', {_id: _id}, function (response) {
            if (response.resCode === 400) {
                toastr.error(JSON.stringify(response.error));
            } else {
                toastr.success(JSON.stringify(response.message));
            }
        });
    });
}


function deleteBackup(_id){
    messageBox("<p> Type 'DELETE' to delete! </p><br><input id='input_delete' type='text' class='form-control'>", "Confirm delete", null, null, function(){
        if($('#input_delete').val() === 'DELETE') {
            ajx(routes.backups, 'delete', {_id: _id}, function (response) {
                if (response.resCode === 400) {
                    toastr.error(JSON.stringify(response.error));
                } else {
                    location.reload();
                }
            });
        }
    });
}
